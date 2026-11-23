# Campuslands AI Academy · Nueva landing + registro de interesados

Landing de una página que aplica el **Manual de marca v1.0** de AI Academy y convierte el recorrido en una misión espacial, más el flujo de **registro → aviso por Telegram (n8n) → seguimiento en un panel de administración**.

**Sitio publicado:** <https://ia-academy-landing.vercel.app/> · Lighthouse en celular (PageSpeed Insights, 23 nov 2026): Rendimiento 98 · Accesibilidad 100 · Recomendaciones 100 · SEO 100.

- **Reto 3:** `index.html` + `assets/` (la landing).
- **Reto 4:** el formulario de la landing, `n8n/` (flujo exportado), `supabase/schema.sql` (base de datos, permisos e historial) y `admin/` (panel).

## Cómo correrlo

No necesita instalar nada ni compilar: es HTML, CSS y JavaScript sin dependencias.

```bash
git clone https://github.com/<tu-usuario>/ai-academy-landing.git
cd ai-academy-landing
python3 -m http.server 8080        # o: npx serve .
# abre http://localhost:8080  (panel: http://localhost:8080/admin/)
```

Para publicarlo, importa el repositorio en **Vercel** (Framework preset: *Other*, sin comando de build, carpeta raíz `./`) o activa **GitHub Pages** desde `main`.

## Estructura

```
index.html                 Landing (todas las secciones con el contenido real)
assets/css/styles.css      Estilos: solo Poppins y los 6 colores del manual
assets/js/main.js          Interacciones (sin librerías)
assets/js/config.js        URL del webhook de n8n y datos públicos de Supabase
assets/img/                Logos oficiales del manual, Max y retrato del trainer (WebP)
admin/                     Panel de seguimiento (Supabase Auth + RLS)
supabase/schema.sql        Tablas, triggers del historial, reglas de seguridad y admins de prueba
n8n/flujo-registro-ai-academy.json   Flujo de n8n para importar
docs/ACTIVACION.md         Paso a paso para conectar Supabase, n8n y Telegram, y cómo hacer la demo
```

## Las piezas interactivas

| Pieza | Dónde | Qué hace y para qué |
|---|---|---|
| Hero que reacciona | `#inicio` | Las estrellas, el halo y Max siguen el cursor o el dedo. La pregunta «¿Quién eres?» cambia el mensaje, sugiere una misión, adelanta el recomendador y elige el caso de uso que te corresponde. |
| Recorrido con el scroll | toda la página | Barra de progreso del viaje y etapa actual (Despegue → Equipo de vuelo → Elige tu misión → Ventana de lanzamiento → Aterrizaje → Bitácora → Control de misión). Las secciones se revelan al bajar y en «¿Por qué ahora?» la brecha entre quien aplica IA y quien espera crece con el scroll. |
| Recomendador de planes | `#recomendador` | Tres preguntas (quién va, cuánto tiempo, objetivo) → sugiere Ignition, Booster, Liftoff, Odyssey o Nebula, explica por qué, resalta la tarjeta y deja la misión elegida en el formulario. |
| Exploración libre | `#herramientas`, `#casos-uso` | Constelación de las 14 herramientas con filtros por tipo de tarea; cada estrella abre para qué sirve. Antes/después deslizable para los 4 perfiles. |

Las llamadas a la acción (Inscríbete y WhatsApp) quedan fijas en un dock que aparece después del hero; el menú siempre tiene «Inscríbete». Se usan los enlaces reales de la landing actual.

## Marca

- Paleta: Black `#050507`, Evox Purple `#7026E8`, Electric Violet `#9636FF`, Soft Violet `#B783FF`, White `#FFFFFF`, Muted Gray `#8E8998` (más `#DCD6EA`, el tono de apoyo del manual para texto largo).
- Tipografía: Poppins (400–800) en todo.
- Logo: versión horizontal blanca en el menú (fondo negro, ≥ 160 px) y vertical principal en el pie; archivos extraídos del manual, sin redibujar ni recolorear, con su zona de protección.
- Nombre: «Campuslands AI Academy» / «AI Academy» (se corrigió «IA Academy», también en las reseñas).
- Recursos: halos violeta en esquinas opuestas, etiquetas en píldora, palabra destacada en Soft Violet, pasos numerados en Evox, tarjetas al 10 %. Max aparece solo con las poses y expresiones aprobadas (analítico en las preguntas, idea en la respuesta).

## Accesibilidad y rendimiento

- Funciona completo a 375 px; todo lo que responde al cursor responde también al toque.
- Navegación con teclado (radios con flechas, pestañas con flechas, foco visible, enlace «Saltar al contenido», `Esc` cierra el menú).
- `prefers-reduced-motion`: se apagan las estrellas animadas, las órbitas y los desplazamientos.
- Contrastes del manual (texto largo en `#DCD6EA` sobre negro; Evox solo en botones con texto blanco).
- Sin frameworks ni librerías en la landing (≈ 30 KB de JS+CSS), imágenes en WebP con tamaño fijo, carga diferida y fuente con `display=swap`.

## Reto 4 en una línea

Landing → `POST` al webhook de n8n → n8n valida → guarda en Supabase con estado **Nuevo** → avisa a Telegram → responde a la landing. Si un dato obligatorio es inválido, n8n responde 422 y **no guarda ni avisa**. El panel (`/admin`) permite consultar, cambiar el estado (Nuevo, Contactado, En seguimiento, Cerrado) y agregar notas; un trigger de la base guarda en el historial **qué cambió, quién y cuándo**.

Las credenciales (token del bot, clave `service_role` de Supabase) viven solo en n8n; en el repositorio no hay secretos. Paso a paso en [`docs/ACTIVACION.md`](docs/ACTIVACION.md).

---
Hecho por Juan Esteban Bastos Pallares para la prueba de ingreso a Campuslands AI Academy (noviembre de 2026), con apoyo de Claude como herramienta de IA.
