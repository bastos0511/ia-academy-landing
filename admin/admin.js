/* Panel de seguimiento · Campuslands AI Academy
   Lee y actualiza Supabase con la sesión del administrador. Las reglas RLS del esquema
   impiden que alguien sin cuenta de admin vea o cambie datos. */
(() => {
  'use strict';
  const CFG = window.AIA_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const ESTADOS = ['Nuevo', 'Contactado', 'En seguimiento', 'Cerrado'];
  const fmt = d => new Date(d).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (!CFG.SUPABASE_URL || CFG.SUPABASE_URL.includes('TU-PROYECTO')) {
    $('[data-login-msg]').textContent = 'Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY en assets/js/config.js.';
    $('[data-login-msg]').className = 'msg err';
    return;
  }
  const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  let rows = [], filtro = 'Todos', busqueda = '', actual = null, lastFocus = null;

  /* ---------- Sesión ---------- */
  async function start() {
    const { data: { session } } = await sb.auth.getSession();
    session ? enter(session.user) : show('login');
  }
  function show(v) {
    document.querySelectorAll('[data-view]').forEach(el => { el.hidden = el.dataset.view !== v; });
  }
  async function enter(user) {
    const { data: admin } = await sb.from('admins').select('nombre,email').eq('email', user.email).maybeSingle();
    if (!admin) {
      await sb.auth.signOut();
      show('login');
      const m = $('[data-login-msg]'); m.className = 'msg err'; m.textContent = 'Esta cuenta no es administradora del panel.';
      return;
    }
    $('[data-me]').textContent = `${admin.nombre} · ${admin.email}`;
    show('app');
    await load();
  }
  $('[data-login]').addEventListener('submit', async e => {
    e.preventDefault();
    const m = $('[data-login-msg]'); m.className = 'msg'; m.textContent = 'Entrando…';
    const { data, error } = await sb.auth.signInWithPassword({ email: $('#l-email').value.trim(), password: $('#l-pass').value });
    if (error) { m.className = 'msg err'; m.textContent = 'Correo o contraseña incorrectos.'; return; }
    m.textContent = '';
    enter(data.user);
  });
  $('[data-logout]').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });

  /* ---------- Lista ---------- */
  async function load() {
    const { data, error } = await sb.from('registros').select('*').order('creado_en', { ascending: false });
    if (error) { $('[data-rows]').innerHTML = `<tr><td colspan="7">No se pudieron cargar los registros: ${esc(error.message)}</td></tr>`; return; }
    rows = data;
    renderCounts(); renderRows();
  }
  function renderCounts() {
    const c = Object.fromEntries(ESTADOS.map(e => [e, rows.filter(r => r.estado === e).length]));
    const items = [['Todos', rows.length], ...ESTADOS.map(e => [e, c[e]])];
    $('[data-counts]').innerHTML = items.map(([k, n]) => `<button class="count" type="button" aria-pressed="${k === filtro}" data-f="${k}">${k}<b>${n}</b></button>`).join('');
  }
  $('[data-counts]').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; filtro = b.dataset.f; renderCounts(); renderRows(); });
  $('[data-search]').addEventListener('input', e => { busqueda = e.target.value.trim().toLowerCase(); renderRows(); });
  $('[data-refresh]').addEventListener('click', load);
  function renderRows() {
    const list = rows.filter(r => (filtro === 'Todos' || r.estado === filtro) &&
      (!busqueda || [r.nombre, r.correo, r.programa].join(' ').toLowerCase().includes(busqueda)));
    $('[data-empty]').hidden = list.length > 0;
    $('[data-rows]').innerHTML = list.map(r => `
      <tr tabindex="0" data-id="${r.id}" aria-label="Abrir registro de ${esc(r.nombre)}">
        <td class="small">${r.id}</td>
        <td class="small">${fmt(r.creado_en)}</td>
        <td class="name">${esc(r.nombre)}</td>
        <td>${esc(r.correo)}</td>
        <td>${esc(r.programa)}</td>
        <td><span class="tag tag--${r.estado.replace(' ', '-')}">${r.estado}</span></td>
        <td class="small">${fmt(r.actualizado_en)}${r.actualizado_por ? '<br>' + esc(r.actualizado_por) : ''}</td>
      </tr>`).join('');
  }
  $('[data-rows]').addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) open(+tr.dataset.id); });
  $('[data-rows]').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.id) { e.preventDefault(); open(+e.target.dataset.id); } });

  /* ---------- Detalle ---------- */
  const drawer = $('[data-drawer]');
  async function open(id) {
    lastFocus = document.activeElement;
    const { data: r, error } = await sb.from('registros').select('*').eq('id', id).single();
    if (error) return alertMsg('No se pudo abrir el registro.');
    actual = r;
    $('[data-d-id]').textContent = `Registro #${r.id}`;
    $('[data-d-name]').textContent = r.nombre;
    const mail = $('[data-d-mail]'); mail.textContent = r.correo; mail.href = 'mailto:' + r.correo;
    $('[data-d-tel]').textContent = r.telefono || 'No lo dio';
    $('[data-d-prog]').textContent = r.programa;
    $('[data-d-date]').textContent = fmt(r.creado_en);
    $('[data-d-origin]').textContent = r.origen;
    $('[data-d-estado]').value = r.estado;
    $('[data-d-nota]').value = '';
    $('[data-d-msg]').textContent = '';
    drawer.hidden = false;
    $('.drawer__x').focus();
    await loadHistory(id);
  }
  async function loadHistory(id) {
    const { data } = await sb.from('historial').select('*').eq('registro_id', id).order('creado_en', { ascending: false });
    $('[data-d-history]').innerHTML = (data || []).map(h => {
      let what = '';
      if (h.accion === 'creado') what = `Registro creado con estado <b>${h.estado_nuevo}</b>`;
      if (h.accion === 'estado') what = `Cambió el estado: <b>${h.estado_anterior}</b> → <b>${h.estado_nuevo}</b>`;
      if (h.accion === 'nota') what = 'Agregó una nota';
      return `<li><p class="when">${fmt(h.creado_en)} · ${esc(h.actor)}</p><p class="what">${what}</p>${h.nota ? `<p class="note">${esc(h.nota)}</p>` : ''}</li>`;
    }).join('') || '<li><p class="what">Sin movimientos todavía.</p></li>';
  }
  function close() { drawer.hidden = true; actual = null; if (lastFocus) lastFocus.focus(); }
  drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) close(); });
  function alertMsg(t, ok) { const m = $('[data-d-msg]'); m.className = 'msg ' + (ok ? 'ok' : 'err'); m.textContent = t; }

  $('[data-manage]').addEventListener('submit', async e => {
    e.preventDefault();
    if (!actual) return;
    const estado = $('[data-d-estado]').value, nota = $('[data-d-nota]').value.trim();
    if (estado === actual.estado && !nota) return alertMsg('No hay cambios para guardar.');
    if (estado !== actual.estado) {
      const { error } = await sb.from('registros').update({ estado }).eq('id', actual.id);
      if (error) return alertMsg('No se pudo cambiar el estado: ' + error.message);
    }
    if (nota) {
      const { error } = await sb.from('historial').insert({ registro_id: actual.id, accion: 'nota', nota });
      if (error) return alertMsg('No se pudo guardar la nota: ' + error.message);
    }
    alertMsg('Cambios guardados.', true);
    const id = actual.id;
    await load();
    await open(id);
    alertMsg('Cambios guardados.', true);
  });

  start();
})();
