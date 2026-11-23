# Activación y demo · Reto 4

Tiempo estimado: 30–40 minutos. Todo es gratuito. Usa solo datos ficticios.

## 1. Supabase: base de datos y administradores

1. Crea un proyecto en <https://supabase.com> (región: São Paulo o la más cercana).
2. **SQL Editor → New query**: pega el contenido de `supabase/schema.sql` y pulsa **Run**. Crea las tablas `registros`, `historial` y `admins`, los triggers del historial y las reglas de seguridad.
3. **Authentication → Users → Add user → Create new user**, con **Auto Confirm User** activado:
   - `admin.demo@aiacademy.test` con una contraseña de prueba.
   - `admin2.demo@aiacademy.test` (para mostrar que otro administrador continúa el seguimiento).
   Si usas otros correos, cámbialos también al final de `schema.sql` (tabla `admins`).
4. **Project Settings → API**: copia
   - **Project URL** y la clave **anon public** → van en `assets/js/config.js` (son públicas por diseño; RLS protege los datos).
   - La clave **service_role** → solo para la credencial de n8n. **Nunca** en el repositorio.

## 2. Telegram: bot y chat privado de prueba

1. En Telegram habla con **@BotFather** → `/newbot` → ponle nombre → copia el **token**.
2. Abre el chat con tu bot nuevo y escríbele «hola».
3. Para saber el id de tu chat: en el navegador abre `https://api.telegram.org/bot<TOKEN>/getUpdates` y busca `"chat":{"id": 123456789`. Ese número es tu **chat id**.

## 3. n8n: el flujo

1. Crea una cuenta en <https://n8n.io> (la prueba de n8n Cloud alcanza) o usa tu instancia.
2. **Credentials → Add credential**:
   - **Supabase API**: Host = Project URL, Service Role Secret = clave `service_role`. Nómbrala `Supabase AI Academy`.
   - **Telegram API**: Access Token = token del bot. Nómbrala `Bot Telegram AI Academy`.
3. **Workflows → Import from File** → `n8n/flujo-registro-ai-academy.json`.
4. Abre los nodos **Guardar registro (Supabase)** y **Avisar por Telegram** y elige las credenciales que creaste. El chat de destino ya viene configurado en **Avisar por Telegram**.
5. Guarda y activa el flujo (interruptor **Active**). En el nodo **Formulario landing** copia la **Production URL** (termina en `/webhook/aia-registro`).
6. Pégala en `assets/js/config.js` → `N8N_WEBHOOK_URL`, haz commit y push. Vercel publica solo.

## 4. Verificación rápida (sin la landing)

```bash
# válido → 201 {"ok":true,"id":N}, llega el aviso a Telegram y aparece en el panel
curl -i -X POST "$N8N_URL" -H 'Content-Type: application/json' \
  -d '{"nombre":"Persona Ficticia","correo":"ficticia@ejemplo.test","programa":"Booster (8 h)","telefono":"300 123 4567"}'

# inválido (correo mal escrito) → 422 {"ok":false,"errores":{...}}; no se guarda ni se avisa
curl -i -X POST "$N8N_URL" -H 'Content-Type: application/json' \
  -d '{"nombre":"Persona Ficticia","correo":"ficticia-sin-arroba","programa":"Booster (8 h)"}'
```

## 5. Guion de la demo (lo que pide el reto)

1. Abre la landing publicada → sección **Solicita información** → registra a una persona ficticia (p. ej. «Valentina Rueda», `valentina.rueda@ejemplo.test`, Liftoff, teléfono opcional). Aparece la confirmación.
2. Muestra el mensaje en **Telegram** con nombre, correo, programa y teléfono, y el número de registro.
3. Abre `/admin`, entra con `admin.demo@aiacademy.test`, busca a Valentina (mismo número de registro), cámbiala a **Contactado** y escribe una nota → **Guardar cambios**.
4. Cierra y vuelve a abrir el registro (o entra con `admin2.demo@aiacademy.test`): siguen el estado, la nota y el historial con quién hizo cada cambio y cuándo.
5. En la landing intenta enviar con un correo inválido: el formulario lo marca y no envía. Para probar el servidor sin el navegador, usa el segundo `curl`: n8n responde 422, no hay registro nuevo en el panel ni aviso en Telegram.

## Acceso al panel de prueba (para la entrega)

- URL: `https://<tu-sitio>/admin/`
- Usuario: `admin.demo@aiacademy.test`
- Contraseña: la que definiste en Supabase (compártela en el correo de entrega, no en el repositorio).
