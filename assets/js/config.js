/* Configuración pública del sitio.
   Aquí NO van secretos: la URL del webhook de n8n y la clave "anon" de Supabase son públicas por diseño
   (la seguridad la ponen las reglas RLS de Supabase y la validación del flujo en n8n).
   El token del bot de Telegram y la clave service_role viven solo en las credenciales de n8n. */
window.AIA_CONFIG = {
  // URL de producción del nodo Webhook de n8n (termina en /webhook/aia-registro)
  N8N_WEBHOOK_URL: "https://TU-INSTANCIA.app.n8n.cloud/webhook/aia-registro",
  // Proyecto de Supabase (Project Settings → API Keys → Publishable key)
  SUPABASE_URL: "https://vmqskrwnntlreodrzibq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_KurIW9PYb6FlC0pdTCCPug_kt00BhQl"   // publishable key (antes "anon")
};
