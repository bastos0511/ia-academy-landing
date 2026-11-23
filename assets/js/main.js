/* Campuslands AI Academy · interacciones de la landing (sin dependencias) */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.AIA_CONFIG || {};

  /* ---------- Datos ---------- */
  const MISSIONS = {
    ignition: { name: 'Ignition', time: '4 horas' },
    booster: { name: 'Booster', time: '8 horas' },
    liftoff: { name: 'Liftoff', time: '12 horas' },
    odyssey: { name: 'Odyssey', time: 'personalizado' },
    nebula: { name: 'Nebula', time: 'pregrabado' }
  };
  const WHO = {
    empresa: { lead: 'Un programa a la medida de tu empresa: herramientas, duración y profundidad según tu industria y tus roles.', mission: 'odyssey', quien: 'empresa', caso: 0 },
    lider: { lead: 'Lleva a tu equipo de las tareas repetitivas a los flujos automáticos, con casos que ya hacen todos los días.', mission: 'liftoff', quien: 'equipo', caso: 1 },
    independiente: { lead: 'Agentes y prompts para tu rol: propuestas, seguimiento y entregables en minutos, no en horas.', mission: 'booster', quien: 'yo', caso: 2 },
    rrhh: { lead: 'Onboarding y acompañamiento con asistentes que guían, responden dudas y recogen feedback por ti.', mission: 'booster', quien: 'equipo', caso: 3 }
  };
  const TOOLS = [
    { n: 'ChatGPT', c: 'asistentes', d: 'Asistente conversacional para redactar, resumir, analizar datos y crear tus propios GPT para tareas repetidas.' },
    { n: 'Claude', c: 'asistentes', d: 'Asistente para trabajar con documentos largos, redactar con criterio y montar proyectos con tus propios archivos.' },
    { n: 'Gemini', c: 'asistentes', d: 'La IA de Google conectada a Gmail, Docs y Drive para trabajar sobre lo que ya tienes.' },
    { n: 'Microsoft Copilot', c: 'asistentes', d: 'La IA dentro de Word, Excel, Outlook y Teams para el trabajo de todos los días.' },
    { n: 'GitHub Copilot', c: 'automatizar', d: 'Asistente de programación que sugiere, explica y corrige código mientras escribes.' },
    { n: 'Make', c: 'automatizar', d: 'Conecta tus aplicaciones y arma flujos automáticos sin escribir código.' },
    { n: 'Zapier', c: 'automatizar', d: 'Automatiza tareas entre miles de aplicaciones con disparadores y acciones.' },
    { n: 'Midjourney', c: 'crear', d: 'Genera imágenes a partir de texto para conceptos, campañas y presentaciones.' },
    { n: 'ElevenLabs', c: 'crear', d: 'Convierte texto en voces y locuciones naturales, en varios idiomas.' },
    { n: 'HeyGen', c: 'crear', d: 'Produce videos con avatares y traducción de voz a partir de un guion.' },
    { n: 'Notion AI', c: 'investigar', d: 'Resume notas, redacta y ordena la documentación de tu equipo dentro de Notion.' },
    { n: 'Perplexity', c: 'investigar', d: 'Buscador con IA que responde citando sus fuentes.' },
    { n: 'NotebookLM', c: 'investigar', d: 'Responde solo con base en tus documentos y crea resúmenes, guías y audios.' },
    { n: 'Read AI', c: 'investigar', d: 'Toma notas de tus reuniones y resume acuerdos, tareas y responsables.' }
  ];
  const CASES = [
    { b: 'Procesos comerciales manuales, lanzamientos lentos y decisiones a ciegas por falta de contenido y reportes actualizados.', a: 'Asistentes de IA que crean correos, propuestas y reportes en minutos, con métricas claras para escalar ventas sin fricción.' },
    { b: 'Pilotos desconectados que no escalan y escasa evidencia para justificar la inversión ante la dirección.', a: 'Talleres intensivos de 4 h con agentes funcionales, casos de uso claros y métricas de eficiencia listas para presentar.' },
    { b: 'Demasiado tiempo en tareas repetitivas, poco foco en vender y mínima diferenciación frente al mercado.', a: 'Prompts estratégicos que generan propuestas, automatizan el seguimiento y entregan resultados personalizados en segundos.' },
    { b: 'Onboarding genérico, procesos manuales y nulo acompañamiento adaptado a cada rol.', a: 'Rutas de microlearning con bots que guían, responden dudas y capturan feedback continuo de forma automática.' }
  ];

  /* ---------- Navegación ---------- */
  const nav = $('.nav'), toggle = $('.nav__toggle'), menu = $('#menu');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { toggle.click(); toggle.focus(); } });

  /* ---------- Recorrido: barra de progreso, etapa actual, dock ---------- */
  const fill = $('.trip__fill'), trip = $('.trip'), stageEl = $('.trip__stage'), dock = $('[data-dock]');
  const stages = $$('[data-stage]');
  const navLinks = $$('.nav__menu a[href^="#"]');
  let ticking = false;
  const onScroll = () => {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    fill.style.width = (p * 100).toFixed(2) + '%';
    nav.classList.toggle('is-solid', h.scrollTop > 30);
    const pastHero = h.scrollTop > window.innerHeight * 0.6;
    trip.classList.toggle('is-on', pastHero);
    dock.classList.toggle('is-on', pastHero);
    const mid = window.innerHeight * 0.45;
    let cur = stages[0];
    for (const s of stages) if (s.getBoundingClientRect().top < mid) cur = s;
    if (stageEl.textContent !== cur.dataset.stage) stageEl.textContent = cur.dataset.stage;
    navLinks.forEach(a => a.classList.toggle('is-current', cur.id && a.getAttribute('href') === '#' + cur.id));
    whyProgress();
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Revelado al hacer scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Hero: estrellas + reacción al cursor/toque ---------- */
  const hero = $('.hero'), canvas = $('.hero__stars'), ctx = canvas.getContext('2d');
  let stars = [], W = 0, H = 0, px = 0, py = 0, heroVisible = true, raf;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function sizeStars() {
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(Math.min(160, W * H / 9000));
    stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.9 + 0.1, t: Math.random() * 6.28 }));
    drawStars(0);
  }
  function drawStars(time) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(time / 900 + s.t);
      const x = s.x + px * 26 * s.z, y = s.y + py * 26 * s.z;
      ctx.globalAlpha = 0.25 + 0.6 * s.z * tw;
      ctx.fillStyle = s.z > 0.75 ? '#B783FF' : '#FFFFFF';
      ctx.beginPath(); ctx.arc(x, y, s.z * 1.5, 0, 6.283); ctx.fill();
    }
  }
  function loop(t) { if (heroVisible) drawStars(t); raf = requestAnimationFrame(loop); }
  sizeStars();
  if (!reduce) raf = requestAnimationFrame(loop);
  window.addEventListener('resize', () => { clearTimeout(sizeStars.t); sizeStars.t = setTimeout(sizeStars, 150); });
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
  const maxImg = $('.hero__max');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    px = nx - 0.5; py = ny - 0.5;
    hero.style.setProperty('--mx', (nx * 100).toFixed(1) + '%');
    hero.style.setProperty('--my', (ny * 100).toFixed(1) + '%');
    if (!reduce) {
      maxImg.style.setProperty('--tx', (px * 18).toFixed(1) + 'px');
      maxImg.style.setProperty('--ty', (py * 14).toFixed(1) + 'px');
      maxImg.style.setProperty('--rot', (px * 5).toFixed(2) + 'deg');
    }
    if (reduce) drawStars(0);
  }, { passive: true });

  // Primera elección: cambia el mensaje, la misión sugerida, el recomendador y el caso de uso
  const lead = $('[data-hero-lead]'), badge = $('[data-hero-badge]'), badgeMission = $('[data-hero-mission]'), heroCta = $('[data-hero-cta]');
  $$('[data-who]').forEach(btn => btn.addEventListener('click', () => {
    const w = WHO[btn.dataset.who];
    $$('[data-who]').forEach(b => b.setAttribute('aria-checked', String(b === btn)));
    lead.style.opacity = 0;
    setTimeout(() => { lead.textContent = w.lead; lead.style.opacity = 1; }, reduce ? 0 : 180);
    const m = MISSIONS[w.mission];
    badgeMission.textContent = `${m.name} · ${m.time}`;
    badge.classList.add('is-set');
    heroCta.textContent = `Ver misión ${m.name}`;
    heroCta.href = '#mision-' + w.mission;
    heroCta.onclick = () => highlightPlan(w.mission);
    const q1 = $(`input[name="quien"][value="${w.quien}"]`);
    if (q1 && !q1.checked) { q1.checked = true; if (step === 1) goStep(2); }
    showCase(w.caso);
  }));
  // Navegación con flechas dentro del grupo de radios del hero
  $('.who__opts').addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const bs = $$('[data-who]'), i = bs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const n = bs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length];
    n.focus(); n.click();
  });

  /* ---------- Constelación de herramientas ---------- */
  const starsUl = $('[data-tools]'), svg = $('.constellation__lines'), card = $('[data-tool-card]'), box = $('.constellation');
  const POS_D = [[12,18],[30,10],[48,20],[66,9],[84,18],[20,42],[40,38],[60,44],[80,40],[10,66],[30,62],[50,72],[70,56],[34,88]];
  const POS_M = [[22,6],[64,7],[40,14],[74,19],[30,24],[66,29],[26,34],[70,39],[24,45],[62,49],[32,55],[72,58],[24,64],[56,67]];
  TOOLS.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'star'; li.dataset.cat = t.c;
    li.innerHTML = `<button type="button" aria-label="${t.n}: ver para qué sirve"><span class="star__dot"></span><span>${t.n}</span></button>`;
    li.querySelector('button').addEventListener('click', () => pickTool(i));
    starsUl.appendChild(li);
  });
  const starEls = $$('.star', starsUl);
  let edges = [];
  function layoutStars() {
    const mobile = box.clientWidth < 600;
    const P = mobile ? POS_M : POS_D;
    starEls.forEach((li, i) => { li.style.left = P[i][0] + '%'; li.style.top = P[i][1] + '%'; li.dataset.x = P[i][0]; li.dataset.y = P[i][1]; });
    const w = box.clientWidth, h = box.clientHeight;
    edges = [];
    P.forEach((a, i) => {
      const d = P.map((b, j) => [j, Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h)]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 2);
      d.forEach(([j]) => { if (!edges.some(([p, q]) => (p === j && q === i))) edges.push([i, j]); });
    });
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML = edges.map(([i, j]) => `<line x1="${P[i][0] * w / 100}" y1="${P[i][1] * h / 100}" x2="${P[j][0] * w / 100}" y2="${P[j][1] * h / 100}" data-a="${i}" data-b="${j}"/>`).join('');
    applyFilter(curFilter);
  }
  let curFilter = 'todas', curTool = -1;
  function pickTool(i) {
    curTool = i;
    const t = TOOLS[i];
    starEls.forEach((li, k) => li.classList.toggle('is-active', k === i));
    $$('line', svg).forEach(l => l.classList.toggle('is-hot', +l.dataset.a === i || +l.dataset.b === i));
    $('.tool-card__k', card).textContent = { asistentes: 'Asistente', automatizar: 'Automatización', crear: 'Creación de contenido', investigar: 'Investigar y organizar' }[t.c];
    $('.tool-card__name', card).textContent = t.n;
    $('.tool-card__txt', card).textContent = t.d;
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
  }
  function applyFilter(f) {
    curFilter = f;
    starEls.forEach(li => li.classList.toggle('is-dim', f !== 'todas' && li.dataset.cat !== f));
    $$('line', svg).forEach(l => {
      const a = TOOLS[+l.dataset.a].c, b = TOOLS[+l.dataset.b].c;
      l.classList.toggle('is-dim', f !== 'todas' && !(a === f && b === f));
    });
  }
  $$('[data-filter]').forEach(b => b.addEventListener('click', () => {
    $$('[data-filter]').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    applyFilter(b.dataset.filter);
    const first = TOOLS.findIndex(t => b.dataset.filter === 'todas' || t.c === b.dataset.filter);
    if (b.dataset.filter !== 'todas') pickTool(first);
  }));
  layoutStars();
  window.addEventListener('resize', () => { clearTimeout(layoutStars.t); layoutStars.t = setTimeout(() => { layoutStars(); if (curTool >= 0) pickTool(curTool); }, 150); });

  /* ---------- Recomendador de misiones ---------- */
  const form = $('[data-reco]'), qs = $$('.reco__q', form), dots = $$('.reco__dots i'), back = $('[data-reco-back]');
  const result = $('[data-reco-result]'), why = $('[data-reco-why]'), go = $('[data-reco-go]'), title = $('[data-reco-title]'), face = $('[data-reco-face]');
  let step = 1;
  function goStep(n) {
    step = n;
    qs.forEach(q => q.classList.toggle('is-active', +q.dataset.q === n));
    dots.forEach((d, i) => d.classList.toggle('on', i < n));
    back.hidden = n === 1;
  }
  function setFace(name) {
    face.src = `assets/img/visor-${name}.webp`;
    face.classList.remove('swap'); void face.offsetWidth; face.classList.add('swap');
  }
  form.addEventListener('change', e => {
    if (e.target.type !== 'radio') return;
    const n = +e.target.closest('.reco__q').dataset.q;
    if (n < 3) setTimeout(() => goStep(n + 1), reduce ? 0 : 260);
    else setTimeout(recommend, reduce ? 0 : 260);
  });
  back.addEventListener('click', () => goStep(Math.max(1, step - 1)));
  function recommend() {
    const v = Object.fromEntries(new FormData(form));
    if (!v.quien || !v.tiempo || !v.objetivo) return goStep(!v.quien ? 1 : !v.tiempo ? 2 : 3);
    let m, r;
    if (v.tiempo === 'libre') { m = 'nebula'; r = 'Quieres avanzar a tu ritmo: Nebula es pregrabada, va por niveles y tienes acceso 24/7 a materiales y comunidad.'; }
    else if (v.objetivo === 'estrategia' || v.tiempo === 'medida' || (v.quien === 'empresa' && v.objetivo !== 'entender')) { m = 'odyssey'; r = 'Lo tuyo es un programa a la medida: Odyssey se arma con las herramientas, la duración y la profundidad que necesita tu empresa, con acompañamiento estratégico.'; }
    else if (v.objetivo === 'automatizar' || v.tiempo === '12') { m = 'liftoff'; r = 'Quieres escalar la operación: en Liftoff (12 h) aprendes a automatizar procesos reales con n8n y diseñas flujos aplicados a tu negocio.'; }
    else if (v.objetivo === 'rol' || v.tiempo === '8') { m = 'booster'; r = 'Buscas resultados en tu rol: Booster (8 h) suma técnicas de prompting, 2 herramientas a tu elección y agentes personalizados.'; }
    else { m = 'ignition'; r = 'Es el mejor punto de partida: Ignition (4 h) te muestra el impacto real de la IA en tu industria y sales con tu primer agente creado en vivo.'; }
    if (v.objetivo === 'automatizar' && v.tiempo === '4' && m === 'liftoff') r += ' Automatizar procesos toma más de una mañana; por eso te sugerimos 12 h.';
    const M = MISSIONS[m];
    title.innerHTML = `Tu misión: <em class="hl">${M.name}</em> · ${M.time}`;
    why.textContent = r;
    form.hidden = true; result.hidden = false; result.focus({ preventScroll: true });
    setFace('idea');
    go.href = '#mision-' + m;
    go.textContent = `Ver la misión ${M.name}`;
    go.onclick = () => highlightPlan(m);
    highlightPlan(m, false);
    badgeMission.textContent = `${M.name} · ${M.time}`; badge.classList.add('is-set');
  }
  $('[data-reco-reset]').addEventListener('click', () => {
    form.reset(); form.hidden = false; result.hidden = true; goStep(1); setFace('analitico');
    title.textContent = 'Responde tres preguntas y te sugerimos tu misión';
    $$('.plan').forEach(p => p.classList.remove('is-match'));
  });
  function highlightPlan(m) {
    $$('.plan').forEach(p => p.classList.toggle('is-match', p.dataset.plan === m));
    const sel = $('#f-programa');
    const opt = [...sel.options].find(o => o.text.toLowerCase().startsWith(m));
    if (opt && !sel.value) sel.value = opt.text;
  }

  /* ---------- ¿Por qué ahora? ligado al scroll ---------- */
  const whySec = $('#por-que-ahora'), gap = $('.why__gap'), whyItems = $$('.why__item');
  function whyProgress() {
    const r = whySec.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / (r.height * 0.9)));
    gap.style.setProperty('--p', p.toFixed(3));
    const mid = window.innerHeight * 0.72;
    whyItems.forEach(it => it.classList.toggle('is-in', it.getBoundingClientRect().top < mid));
  }

  /* ---------- Antes / después ---------- */
  const ba = $('.ba'), range = $('#ba-range'), tabs = $$('[data-case]');
  const setPos = v => ba.style.setProperty('--pos', v + '%');
  range.addEventListener('input', () => setPos(range.value));
  function showCase(i) {
    tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    ba.setAttribute('aria-labelledby', 'tab-' + i);
    $('[data-before]').textContent = CASES[i].b;
    $('[data-after]').textContent = CASES[i].a;
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showCase(i));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      tabs[n].focus(); showCase(n);
    });
  });
  showCase(0);
  // Pista de uso: el divisor se mueve solo una vez cuando la sección aparece
  if (!reduce) new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    let t0;
    const anim = t => { t0 ??= t; const k = (t - t0) / 1600; if (k > 1) { setPos(50); range.value = 50; return; } const v = 50 + Math.sin(k * Math.PI * 2) * 22; setPos(v.toFixed(1)); requestAnimationFrame(anim); };
    requestAnimationFrame(anim);
  }, { threshold: 0.6 }).observe(ba);

  /* ---------- Formulario de solicitud (Reto 4 → n8n) ---------- */
  const lf = $('[data-lead-form]'), status = $('[data-form-status]'), submit = $('[data-submit]');
  const RULES = {
    nombre: v => v.trim().length < 3 ? 'Escribe tu nombre completo (mínimo 3 letras).' : /[0-9<>]/.test(v) ? 'El nombre no puede tener números ni símbolos < >.' : '',
    correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@empresa.com.',
    programa: v => v ? '' : 'Elige el programa que te interesa.',
    telefono: v => { const d = v.replace(/[\s()+-]/g, ''); return !v.trim() || (/^\d{7,15}$/.test(d)) ? '' : 'Si lo escribes, usa solo números (7 a 15 dígitos).'; }
  };
  function check(name) {
    const el = lf.elements[name], msg = RULES[name](el.value);
    el.closest('.field').classList.toggle('has-error', !!msg);
    el.setAttribute('aria-invalid', String(!!msg));
    $('#e-' + name).textContent = msg;
    return !msg;
  }
  Object.keys(RULES).forEach(n => lf.elements[n].addEventListener('blur', () => { if (lf.elements[n].value) check(n); }));
  lf.addEventListener('submit', async e => {
    e.preventDefault();
    status.className = 'form__status'; status.textContent = '';
    const ok = Object.keys(RULES).map(check).every(Boolean);
    if (!ok) { lf.querySelector('[aria-invalid="true"]').focus(); return; }
    if (lf.elements.empresa_web.value) return; // trampa para bots
    const data = {
      nombre: lf.elements.nombre.value.trim(),
      correo: lf.elements.correo.value.trim().toLowerCase(),
      programa: lf.elements.programa.value,
      telefono: lf.elements.telefono.value.trim(),
      origen: 'landing'
    };
    if (!CFG.N8N_WEBHOOK_URL || CFG.N8N_WEBHOOK_URL.includes('TU-INSTANCIA')) {
      status.className = 'form__status err';
      status.textContent = 'El formulario todavía no está conectado a n8n. Configura N8N_WEBHOOK_URL en assets/js/config.js.';
      return;
    }
    submit.disabled = true; submit.textContent = 'Enviando…';
    try {
      const res = await fetch(CFG.N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        lf.reset();
        status.className = 'form__status ok';
        status.innerHTML = `<strong>¡Listo, ${data.nombre.split(' ')[0]}!</strong> Recibimos tu solicitud para ${data.programa}. Un especialista te escribirá pronto a ${data.correo}.`;
      } else if (body.errores) {
        Object.entries(body.errores).forEach(([k, m]) => { const f = lf.elements[k]; if (f) { f.closest('.field').classList.add('has-error'); $('#e-' + k).textContent = m; } });
        status.className = 'form__status err'; status.textContent = 'Revisa los campos marcados.';
      } else throw new Error('respuesta ' + res.status);
    } catch (err) {
      status.className = 'form__status err';
      status.textContent = 'No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.';
    } finally { submit.disabled = false; submit.textContent = 'Solicitar información'; }
  });

  onScroll();
})();
