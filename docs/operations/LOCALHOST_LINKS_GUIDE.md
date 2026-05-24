# QueGym — guia de enlaces localhost

Guia rapida para pruebas locales desde perspectiva de usuario, admin y partner. Marca visible **QueGym** (rebrand Fase 1); plan: `docs/operations/REBRAND_QUEGYM_PLAN.md`.

Nota de alcance: esta guia valida el runtime productivo (`apps/web`, `services/*` y APIs asociadas). `Floit Wireframe v.0.2/` se considera referencia UX/documental y no fuente de validacion de release.

**Catálogo (2026-05):** en BD local cargada hay **~95 venues** importados desde CSV; los **8 demos** del seed (`oxide-chacao`, etc.) **no están en Postgres**. Slug de referencia para QA: `gym-fitness-caracas`. Import/actualización: `docs/operations/VENUES_CATALOG_IMPORT.md` (`pnpm venues:load`). Las secciones históricas de evidencia más abajo pueden aún citar `oxide-chacao` como registro de ejecuciones anteriores.

## 1) Requisitos previos

- Levantar DB: `pnpm docker:up`
- Levantar backend: `pnpm dev:services`
- Levantar web: `pnpm dev:web`

### Configuración persistente recomendada (admin + partner local)

Para evitar errores de acceso al reiniciar el entorno local, mantener en `apps/web/.env.local`:

- `ADMIN_API_TOKEN=change-me-dev-only`
- `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD=true`
- `ADMIN_LOCAL_LOGIN_EMAIL=<tu correo admin>`
- `ADMIN_LOCAL_LOGIN_PASSWORD=<tu contraseña admin>`
- `PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD=true`
- `PARTNER_LOCAL_LOGIN_EMAIL=<tu correo partner>`
- `PARTNER_LOCAL_LOGIN_PASSWORD=<tu contraseña partner>`

Recomendado además en `services/leads/.env` y `services/partner/.env`:

- `ADMIN_API_TOKEN=change-me-dev-only`

Con esto, si no hay sesión activa:

- rutas admin (`/admin/*`) redirigen a `/admin/login`,
- rutas partner protegidas (`/partner/gyms`, `/partner/leads`) redirigen a `/partner/login`.

Para habilitar workspace partner en un centro, asegurar ownership activo:

- `npx pnpm --filter @floit/partner-service seed:ownership -- --email <tu_correo_partner> --venue gym-fitness-caracas --status active` (u otro slug importado listado en `/admin/catalogo`)

### Catálogo importado (opcional / primera vez)

```bash
pnpm venues:normalize    # CSV → JSON + geocode
pnpm venues:import       # requiere catalog :4010
pnpm venues:validate:live
```

Ver `docs/operations/VENUES_CATALOG_IMPORT.md` y `data/README.md`.

## 2) Frontend (web)

### Publico / usuario

- Home: `http://localhost:3000/`
- Buscar: `http://localhost:3000/buscar`
- Favoritos: `http://localhost:3000/favoritos`
- Comparar: `http://localhost:3000/comparar`
- Privacidad: `http://localhost:3000/privacidad`

CTAs hacia el área partner (login):

- En el header global (desktop): **«¿Eres partner?»** → **`/partner/login`** (`floit-main-header.tsx`).
- En la home, banner inferior «Reclamar mi centro» → **`/partner/login`**. El alta o reclamo sin cuenta previa sigue en **`/partner/claim`** (enlace desde login «Primera vez» u otras pantallas partner).

Inventario completo de rutas: `docs/operations/WEB_ROUTES_PLATFORM.md`.

### Admin

- Login admin: `http://localhost:3000/admin/login`
- Dashboard/Home admin: `http://localhost:3000/admin`
- Configuración admin (sesión, flags auth, enlaces docs): `http://localhost:3000/admin/configuracion`
- Catálogo (venues): `http://localhost:3000/admin/catalogo` (alias: `http://localhost:3000/admin/venues`)
- Duplicados: `http://localhost:3000/admin/duplicados`
- Moderación media: `http://localhost:3000/admin/moderacion-media`
- Editor de ficha (mismo panel que partner, sesión admin): `http://localhost:3000/admin/catalogo/<venueSlug>/panel` (ej. `gym-fitness-caracas`)
- Taxonomías (modalidades/amenidades): `http://localhost:3000/admin/taxonomias`
- Leads: `http://localhost:3000/admin/leads`
- Analytics: `http://localhost:3000/admin/analytics` — KPIs, gráficos (barras apiladas, donut dispositivos, líneas), tablas; panel colapsable «Detalle técnico» (funnel, experimento, SLA)
- Solicitudes (claims / ownership): `http://localhost:3000/admin/partner-claims` (barra lateral **Solicitudes**) — dashboard (KPIs, búsqueda, chips, tabla, **Ver detalle** en modal, CSV); **`#operaciones-y-sync`**: estado partner-service (OIDC/colas/readiness), DLQ sync y DLQ outbox (búsqueda, selección, reintentos), ownership partner↔venue (filtros, revocar), auditoría ownership (filtros, fecha, CSV, paginación). Lista de claims incluye **`updatedAt`** para línea de tiempo en el modal.

### Partner / aliado

- Login partner: `http://localhost:3000/partner/login`
- Hub de centros (recomendado): `http://localhost:3000/partner/venues` (query opcional `?venueSlug=<slug>`)
- Selector legacy (redirect a venues): `http://localhost:3000/partner/gyms`
- Panel partner: `http://localhost:3000/partner/panel?venueSlug=<slug>`
- Planes (redirect al panel): `http://localhost:3000/partner/planes?venueSlug=<slug>`
- Fotos (redirect al panel, sección galería): `http://localhost:3000/partner/fotos?venueSlug=<slug>`
- Redirect canónico: `http://localhost:3000/partner/panel/<venueSlug>` → mismo panel con query `venueSlug`
- Bandeja de leads: `http://localhost:3000/partner/leads`
- Solicitud de claim / alta pública: `http://localhost:3000/partner/claim` (desde catálogo admin: `/partner/claim?returnTo=/admin/catalogo`). Opcional en **`partner-service`**: `PARTNER_CLAIM_STATUS_WEBHOOK_URL` (+ `PARTNER_CLAIM_STATUS_WEBHOOK_SECRET`) para recibir un POST cuando admin aprueba/rechaza en `/admin/partner-claims` (payload JSON `partner_claim_status_changed`; útil para enlazar correo transaccional vía Zapier/Make).
- Configuración: `http://localhost:3000/partner/configuracion` y subrutas (`mis-centros`, `cambiar-correo`, `eliminar-cuenta`)

Desde el panel con centro activo, el lateral incluye **«← Mis centros»** → **`/partner/venues`** (preserva `venueSlug` en la URL cuando aplica).

Cierre de sesión partner (misma sesión HttpOnly):

- Handler: **`POST /partner/logout`** únicamente (formulario; no usar GET).
- UI habitual: `/partner/venues` u otras vistas con botón explícito; en el panel con `?venueSlug=`, **Configuración → Cuenta → Cuenta y acceso** incluye «Cerrar sesión» junto a «Eliminar cuenta».

Nota de autenticación partner:

- El acceso de `/partner/login` usa formulario de `email + contraseña`.
- La web intercambia credenciales contra el `token_endpoint` OIDC (`grant_type=password`) y guarda sesión HttpOnly.
- Asegurar en el IdP que el cliente partner tenga habilitado ese grant.
- Si el IdP no permite ese grant, la UI muestra error controlado `oidc_password_grant_not_enabled`.
- En local, opcionalmente se puede habilitar login QA sin IdP con:
  - `PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD=true`
  - `PARTNER_LOCAL_LOGIN_EMAIL=owner@example.com`
  - `PARTNER_LOCAL_LOGIN_PASSWORD=oxide-partner-2026`
  - y `PARTNER_DEV_EMAIL=owner@example.com` para el fallback backend.
  - este fallback QA aplica solo fuera de `production`.

Checklist mínimo para que login partner funcione end-to-end:

- Configurar en `apps/web`:
  - `PARTNER_OIDC_ISSUER`
  - `PARTNER_OIDC_CLIENT_ID`
  - `PARTNER_OIDC_CLIENT_SECRET` (si el cliente lo requiere)
  - `PARTNER_OIDC_SCOPE` (opcional; default `openid email profile`)
  - `PARTNER_SERVICE_URL`
- Configurar en `partner-service`:
  - `PARTNER_OIDC_ISSUER`
  - `PARTNER_OIDC_AUDIENCE` (default esperado: `floit-partner`)
  - `PARTNER_OIDC_JWKS_URL` (opcional, si no usa `/.well-known/jwks.json`)
- Configurar cliente en IdP:
  - habilitar `grant_type=password` (password/direct access grant),
  - emitir `access_token` con `email` y `sub`,
  - alinear `aud` con `PARTNER_OIDC_AUDIENCE` del guard backend.
- Configurar usuario partner en IdP:
  - correo confirmado y contraseña activa.
- Verificar ownership para administración de centros:
  - debe existir relación activa partner↔venue en `partner_venue_ownerships`,
  - si no existe, crear claim y aprobar desde `/admin/partner-claims`.
- Para operación completa del panel (leads/sync):
  - `PARTNER_TO_LEADS_INTERNAL_TOKEN` + `LEADS_INTERNAL_API_TOKEN`,
  - `PARTNER_TO_CATALOG_INTERNAL_TOKEN` + `CATALOG_INTERNAL_API_TOKEN` (o fallback local).

## 3) APIs BFF en web (Next.js)

- Admin catálogo por venue (delegación admin → mismas operaciones que partner): prefijo  
  `http://localhost:3000/api/admin/catalog/venues/{venueSlug}`  
  — `profile` (GET/PUT), `plans` (GET/POST), `plans/{id}` (PATCH), `leads` (GET), `leads/{id}/status` (PATCH), `photos` (GET/POST), `photos/{id}` (DELETE), `photos/{id}/order` (PATCH), `photos/reorder` (PATCH), `photos/{id}/cover` (PATCH). Requiere auth admin (`getAdminAuthHeader`) y `partner-service` con rutas `v1/admin/catalog/venues/...`.
- Admin leads:
  - Lista y filtros (server/BFF): `GET http://localhost:3000/api/admin/leads`
  - Export CSV: `GET http://localhost:3000/api/admin/leads/export`
  - Detalle y operación (modal admin): `GET` / `PATCH http://localhost:3000/api/admin/leads/{id}` → `leads-service` `GET/PATCH /v1/admin/lead/:id` (auth admin; estados p. ej. `received` / `contacted` / `closed` / sospechoso, campo `adminNote`).
- Admin taxonomías (modalidades/amenidades → `catalog-service`):  
  `GET/POST http://localhost:3000/api/admin/taxonomy-attributes`,  
  `PATCH http://localhost:3000/api/admin/taxonomy-attributes/{slug}`  
  Requiere auth admin y **`ADMIN_API_TOKEN` también definido en `services/catalog`** (mismo valor que en web).
- Compare search modal: `GET http://localhost:3000/api/compare/search?q=<texto>&exclude=<slug1,slug2>`
- Demo images bridge: `GET http://localhost:3000/api/demo-images/{imageId}`
- Partner profile global (deprecated -> `410`): `http://localhost:3000/api/partner/me/profile`
- Partner plans globales (deprecated -> `410`): `http://localhost:3000/api/partner/me/plans`
- Partner venue photos:
  - `GET/POST http://localhost:3000/api/partner/me/venues/{venueSlug}/photos`
  - `DELETE http://localhost:3000/api/partner/me/venues/{venueSlug}/photos/{id}`
  - `PATCH http://localhost:3000/api/partner/me/venues/{venueSlug}/photos/{id}/order`
  - `PATCH http://localhost:3000/api/partner/me/venues/{venueSlug}/photos/reorder`
  - `PATCH http://localhost:3000/api/partner/me/venues/{venueSlug}/photos/{id}/cover`
- Partner venue workspace:
  - `GET http://localhost:3000/api/partner/me/venues`
  - `GET/PUT http://localhost:3000/api/partner/me/venues/{venueSlug}/profile`
  - `GET/POST http://localhost:3000/api/partner/me/venues/{venueSlug}/plans`
  - `PATCH http://localhost:3000/api/partner/me/venues/{venueSlug}/plans/{id}`
  - `GET http://localhost:3000/api/partner/me/venues/{venueSlug}/leads`
  - `PATCH http://localhost:3000/api/partner/me/venues/{venueSlug}/leads/{id}/status`
  - `POST http://localhost:3000/api/partner/me/leads/{id}/status` -> `410` (deprecated)

Nota de endurecimiento:

- Los endpoints globales partner (`/me/profile`, `/me/plans`, `/me/plans/{id}`, `/me/leads`) quedan deprecados para operación diaria y responden `410`.
- La actualización de estado de lead se procesa en modo venue-scoped.
- El flujo soportado es exclusivamente venue-scoped por `venueSlug`.

## 4) Servicios backend y health checks

- Catalog: `http://localhost:4010/health`
- Search: `http://localhost:4011/health`
- Leads: `http://localhost:4012/health`
- Partner: `http://localhost:4013/health`
- Analytics: `http://localhost:4014/health`

## 5) Variables de entorno utiles para vistas operativas locales

### Admin local (fallback token)

- `ADMIN_API_TOKEN=change-me-dev-only`

### Admin local (login por formulario, recomendado en QA)

- `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD=true`
- `ADMIN_LOCAL_LOGIN_EMAIL=<tu correo admin>`
- `ADMIN_LOCAL_LOGIN_PASSWORD=<tu contraseña admin>`

### Partner local (fallback dev)

- `PARTNER_DEV_EMAIL=owner@example.com`

### Partner service — edición admin de fichas sin titular

Para que **`/admin/catalogo/[slug]/panel`** cargue un centro **sin** fila en `partner_venue_ownerships`, definir en **`services/partner/.env`** (o env del proceso):

- `ADMIN_CATALOG_DELEGATE_EMAIL=partner.demo@floit.local` (ejemplo; debe ser un correo coherente con tu seed)

El servicio creará ownership activo delegate→venue y las escrituras usarán ese titular. Si falta el env y el centro no tiene titular, la API responde **422** `venue_delegate_not_configured`.

## 6) Troubleshooting rapido

- Si una ruta de admin devuelve `admin_not_configured`, revisar `ADMIN_API_TOKEN`.
- Si una ruta partner devuelve `partner_not_configured`, revisar `PARTNER_DEV_EMAIL` o token OIDC.
- Si `/partner/gyms` o `/partner/leads` te envía a login repetidamente, validar `PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD` y credenciales `PARTNER_LOCAL_LOGIN_*` en `apps/web/.env.local`.
- Si login admin redirige pero `/admin/leads` muestra error auth, validar `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD`, `ADMIN_LOCAL_LOGIN_*` y `ADMIN_API_TOKEN`.
- Si el **modal Ver** en `/admin/leads` no carga detalle (`GET /api/admin/leads/{id}`), comprobar que **`leads-service`** esté arriba (`4012`) y que el id sea UUID válido del listado.
- Si `/admin` muestra advertencia de datos parciales, revisar disponibilidad de servicios `catalog`/`leads`/`partner` y health checks (`4010`/`4012`/`4013`).
- Si `/admin/catalogo/.../panel` falla con **422** o mensaje de delegación: el slug no tiene titular partner; configurar `ADMIN_CATALOG_DELEGATE_EMAIL` en `partner-service` o aprobar un claim que cree ownership.
- Si `/buscar` no muestra centros, validar `catalog` y `search` arriba (`4010/4011`) y confirmar que `catalog-service` tenga `DATABASE_URL` (o fallback local dev activo).
- Si `home` o `/buscar` muestran placeholders de imagen, validar que `search` esté devolviendo `photoUrls` y verificar persistencia en Postgres (`venues."photoUrls"`).
- Si `localhost:3000` no responde, confirmar que `dev:web` esta arriba y sin conflicto de puerto.
- Si un servicio `401x` falla, revisar que `dev:services` este activo y que `docker:up` este corriendo.

## 7) Checklist de validacion funcional (Sprint 10 UI/UX)

Comando recomendado para validar el flujo principal por HTTP en local:

- `node -e 'const base="http://127.0.0.1:3000"; const slug="gym-fitness-caracas"; const run=async()=>{const checks=["/buscar","/gyms/"+slug,"/comparar","/admin/analytics","/partner/panel"]; for (const path of checks){const r=await fetch(base+path); if(!r.ok) throw new Error(\`route ${path} -> ${r.status}\`);} const leadPayload={venueSlug:slug,intent:"membership",name:"QA Local Sprint10",phone:"+584141234567",email:"qa+local@floit.dev",preferredSlot:"tardes",message:"Prueba automatizada sprint 10",consentAccepted:true,consentVersion:"floit-r2-2026-04"}; const leadRes=await fetch(base+"/api/leads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(leadPayload)}); const leadJson=await leadRes.json().catch(()=>({})); if(!leadRes.ok || !leadJson.publicToken) throw new Error(\`lead submit failed ${leadRes.status}\`); const statusRes=await fetch(base+\`/lead/estado/${encodeURIComponent(leadJson.publicToken)}\`); if(!statusRes.ok) throw new Error(\`lead status ${statusRes.status}\`); const confirmRes=await fetch(base+\`/lead/confirmacion?token=${encodeURIComponent(leadJson.publicToken)}\`); if(!confirmRes.ok) throw new Error(\`lead confirm ${confirmRes.status}\`); console.log("flow_ok", leadJson.publicToken);}; run().catch((e)=>{console.error(String(e)); process.exit(1);});'`

Resultado esperado:

- `flow_ok <publicToken>` en consola.
- Render correcto de rutas principales y token público válido para confirmación/estado del lead.

## 8) Validacion funcional de Home wireframe

Checklist rapido de secciones activas en `http://localhost:3000/`:

- Buscador principal:
  - texto (`q`) + zona (`zone`) navega a `/buscar` con query string.
- Boton "Usar mi ubicacion":
  - solicita geolocalizacion y redirige a `/buscar?lat=...&lng=...&sort=distance&radius_km=12`.
- Accesos rapidos por zona:
  - links operativos hacia `/buscar?zone=...`.
- Chips "Explorar por tipo de centro":
  - aplican filtros reales (`venue_type` o `modality`) en `/buscar`.
- Cards de destacados:
  - cargan dinamicamente desde search (`sort=popularity`), enlazan a `/gyms/[slug]`.
  - acciones rapidas: `Comparar` (`/comparar?c=<slug>`) y `Guardar` (localStorage favoritos).

## 9) Validacion funcional de /buscar (wireframe desktop)

Checklist rapido en `http://localhost:3000/buscar`:

- Barra superior:
  - buscador por texto (`q`) operativo,
  - selector de orden (`sort`) operativo,
  - alternador Lista/Mapa funcional.
- Barra lateral:
  - Zona / Municipio -> `zone`.
  - Tipo de centro -> `venue_type`.
  - Rango de precio -> `budget_min`/`budget_max`.
  - Modalidades -> `modality`.
  - Amenidades clave -> filtro local adicional por `amenities` (sin romper query principal).
- Tarjetas de resultados:
  - acceso a ficha `/gyms/[slug]`,
  - acción `Guardar` en favoritos (`localStorage`),
  - acción `Comparar` persistente (`localStorage`, máximo 3) desde lista/mapa/mobile.
- Header global:
  - el flujo público usa header Floit unificado para navegar entre `Buscar`, `Comparar`, `Favoritos` y `Privacidad`,
  - se removió la barra superior legacy tipo browser (`floit.com.ve` + semáforos).
- Barra flotante comparador en `/buscar`:
  - muestra contador `n/3`,
  - chips de centros seleccionados con botón `×` para quitar sin salir de la página,
  - acciones `Ir a comparar` y `Limpiar`.
- Comparador `/comparar`:
  - rediseño UI en formato tabla por secciones (información básica/servicios/amenidades),
  - botón `+ Añadir centro` abre modal con búsqueda en vivo (sin perder selección actual),
  - estado de comparación persistente entre `/buscar` y `/comparar` por `localStorage`.
- Favoritos `/favoritos`:
  - tarjetas alineadas al estilo visual de discovery,
  - cada ficha expone acción `Comparar/Comparando` que abre modal contextual de comparación en la misma página,
  - badge `Guardado` funciona como toggle de deselección para eliminar centros de favoritos en tiempo real.
- Fotos de centros:
  - `home` y `/buscar` deben renderizar `photoUrls[0]` cuando exista,
  - ficha `/gyms/[slug]` debe renderizar galería real de `photoUrls`,
  - para datos demo locales se usa bridge `/api/demo-images/{imageId}` con URLs persistidas en catálogo.

## 10) Validacion mapa y mobile refinado (hoy)

- Mapa (`/buscar` en modo mapa):
  - marcador visual custom (`📍`) visible,
  - tap/click en marcador selecciona centro y muestra una unica tarjeta contextual custom (sin popup legacy de Leaflet),
  - click en zona vacia del mapa deselecciona el centro activo,
  - CTA `Ver ficha` en tarjeta navega a `/gyms/[slug]`.
- Desktop mapa:
  - layout con listado lateral + mapa principal + tarjeta superpuesta,
  - mapa ocupa toda la altura vertical disponible de la pantalla (viewport-aware),
  - click en ficha del listado lateral enfoca y hace zoom automatico al centro seleccionado,
  - tarjeta contextual del centro se posiciona al lado derecho del pin para mantener visible el icono de ubicacion.
- Mobile mapa:
  - overlays compactos, boton `Ver lista` y bloque inferior de resultados,
  - listado inferior scrolleable con 8 resultados iniciales y accion `Mostrar 8 mas`,
  - al tocar una ficha del listado inferior, el mapa enfoca y acerca al centro seleccionado.
- Mobile lista:
  - favoritos en icono compacto (`☆/★`),
  - filtros en panel desplegable (`+ Filtros`) para evitar ocupar pantalla completa.

## 11) Validacion fotos partner -> cliente

- Partner panel (`/partner/panel`):
  - seleccionar/cargar `venue slug` desde la sección `Editar perfil`,
  - cargar fotos existentes del centro,
  - subir imagen (jpg/png/webp, max 5MB),
  - reordenar imagenes con controles `↑/↓`,
  - reordenar por drag-and-drop (arrastrar tarjeta y soltar sobre otra),
  - marcar foto como portada,
  - validar bloque `Vista previa OG / Social` (titulo, descripcion e imagen de portada),
  - usar `Copiar enlace de ficha` y abrir el enlace para validar la portada en `/gyms/[slug]`,
  - eliminar imagen.
- API partner:
  - verificar respuestas `200/201` en `GET/POST` y `200` en `DELETE`.
- Ficha cliente (`/gyms/[slug]`):
  - galeria mobile y desktop muestra fotos reales sincronizadas desde catalog.

Precondiciones para validar end-to-end:

- Debe existir ownership activo partner↔venue.
- Para propagacion real a catalog, configurar `PARTNER_TO_CATALOG_INTERNAL_TOKEN` en `partner-service`
  y el mismo valor como `CATALOG_INTERNAL_API_TOKEN` en `catalog-service`.
- Si no se definen estas variables en local, el proyecto usa fallback dev compartido:
  - token interno por defecto: `change-me-dev-only`.

## 12) Evidencia de pruebas ejecutadas (backend fotos)

Comando ejecutado (smoke API partner):

- `node -e '<script smoke fotos partner>'`

Resultado observado:

- `GET /v1/partner/me/venues/oxide-chacao/photos` -> `200`
- `POST /v1/partner/me/venues/oxide-chacao/photos` -> `201`
- `PATCH /v1/partner/me/venues/oxide-chacao/photos/{id}/order` -> `200`
- `PATCH /v1/partner/me/venues/oxide-chacao/photos/{id}/cover` -> `200`
- `PATCH /v1/partner/me/venues/oxide-chacao/photos/reorder` -> `200`
- `DELETE /v1/partner/me/venues/oxide-chacao/photos/{id}` -> `200`

Carga de imágenes de muestra por perfiles partner (estado local):

- Se detectaron ownerships activos en `partner-service`: `1`.
- Perfil partner `owner@example.com` / venue `oxide-chacao`:
  - fotos existentes antes de carga: `0`,
  - fotos cargadas de muestra: `3`,
  - total final en partner API: `3`.

Chequeos de disponibilidad ejecutados:

- `/partner/panel` -> `200`
- `/gyms/oxide-chacao` -> `200`
- `partner-service /health` -> `200`
- `catalog-service /health` -> `200`

Verificación posterior del fix de sync partner->catalog (ejecutada):

- Estado previo: `partner photos > 0` y `catalog photoUrls = 0`.
- Acción: upload de foto de prueba para disparar sync.
- Resultado en colas partner:
  - `catalogSync.pending: 1 -> 0`
  - `catalogSync.sent: 0 -> 1`
- Resultado en catálogo:
  - `GET /v1/venues/oxide-chacao` con `photoUrls` ahora `> 0` (se observó `4`).
- Resultado en web cliente:
  - `GET /gyms/oxide-chacao` `200` y HTML con referencias `/uploads/oxide-chacao...`.

## 13) Smoke login partner (`email + contraseña`)

Comando ejecutado (HTTP smoke):

- `node -e '<script smoke partner login>'`

Checks validados:

- `GET /partner/login` -> `200` y render correcto de título.
- `POST /partner/auth/login` sin credenciales -> redirect `303` con `error=missing_credentials`.
- `POST /partner/auth/login` con credenciales inválidas o configuración incompleta -> redirect controlado (`invalid_credentials`, `oidc_password_grant_not_enabled`, `token_exchange_*` o `partner_oidc_issuer_missing`).
- Render de mensajes legibles en UI para errores de grant/config.

Hallazgo local actual:

- El entorno local devolvió `partner_oidc_issuer_missing` al probar credenciales inválidas, lo que confirma que falta definir `PARTNER_OIDC_ISSUER` para autenticación real contra IdP.

## 14) Smoke BFF leads status (venue-scoped)

Comando ejecutado:

- `curl -X PATCH http://localhost:3000/api/partner/me/venues/test-gym/leads/test-id/status -H "content-type: application/json" -d '{"status":"contacted"}'`

Resultado observado en local:

- HTTP `503` con body `{ "error": "partner_not_configured" }`.
- Interpretación: ruta venue-scoped está activa; falta contexto de autenticación partner (sesión OIDC o fallback dev) para completar el PATCH real.

## 15) Smoke deprecación endpoint legacy de estado de lead

Comando ejecutado:

- `curl -X POST http://localhost:3000/api/partner/me/leads/test-id/status -H "content-type: application/json" -d '{"status":"closed","venueSlug":"oxide-chacao"}'`

Resultado observado:

- HTTP `410` con body `{ "error": "deprecated_use_venue_scoped_lead_status_endpoint" }`.

## 16) Fixture reproducible de ownership partner↔venue (QA local)

Objetivo:

- Habilitar y revocar ownership de forma idempotente para validar permisos partner por `venueSlug`.

Comandos:

- Crear/activar ownership:
  - `npx pnpm --filter @floit/partner-service seed:ownership -- --email owner@example.com --venue oxide-chacao --status active`
- Revocar ownership:
  - `npx pnpm --filter @floit/partner-service seed:ownership -- --email owner@example.com --venue oxide-chacao --status revoked`

Notas:

- Usa `PARTNER_SQLITE_PATH` si está configurado; si no, usa `services/partner/data/partner.sqlite`.
- El script actualiza registro existente (`partnerEmail + venueSlug`) o lo crea si no existe.

Smoke ejecutado:

- `seed:ownership --status active` -> `action: "updated"` / `status: "active"`.
- `seed:ownership --status revoked` -> `action: "updated"` / `status: "revoked"`.
- restauración final: `seed:ownership --status active` para mantener operable el workspace partner local.

## 17) Smoke funcional partner venue-scoped (bloque QA actual)

Comando ejecutado (web + BFF):

- `node -e '<script smoke partner login + venues + leads status>'`

Checks observados:

- `GET /partner/login` -> `200`.
- `POST /partner/auth/login` sin credenciales -> `303` con `error=missing_credentials`.
- `GET /api/partner/me/venues` -> `503` con `{ "error": "partner_not_configured" }`.
- `POST /api/leads` -> `201` (lead público creado correctamente).
- `GET /api/partner/me/venues/{venueSlug}/leads` -> `503` por falta de auth partner en web.

Comando complementario (directo a `partner-service` con fallback dev):

- `node -e '<script smoke partner-service venue-scoped>'`

Checks observados:

- `GET /v1/partner/me/venues` -> `200` con `oxide-chacao` activo para `owner@example.com`.
- `GET /v1/partner/me/venues/oxide-chacao/leads` -> `200` (sin items en entorno local actual).
- `PATCH /v1/partner/me/venues/oxide-chacao/leads/{id}/status` con id ficticio -> `403` `leads_integration_not_configured`.

Conclusión operativa:

- El flujo venue-scoped está cableado en web/BFF/backend.
- Para validación E2E completa falta configurar en entorno:
  - auth partner para web (`PARTNER_OIDC_*` o fallback `PARTNER_DEV_EMAIL` en proceso `dev:web`),
  - integración partner->leads (`PARTNER_TO_LEADS_INTERNAL_TOKEN` + `LEADS_INTERNAL_API_TOKEN`) o fallback local `change-me-dev-only`.

## 18) Smoke partner->leads tras fallback local S2S

Cambio aplicado:

- `partner-service` y `leads-service` usan token interno por defecto `change-me-dev-only` cuando no hay variables explícitas de integración.

Comandos ejecutados:

- `curl -X PATCH http://127.0.0.1:4013/v1/partner/me/venues/oxide-chacao/leads/00000000-0000-0000-0000-000000000000/status ...`
- `node -e '<script create lead + list partner leads + patch contacted>'`

Resultados:

- PATCH con ID ficticio ahora responde `403 lead_not_found` (ya no `leads_integration_not_configured`).
- Flujo real directo quedó en verde:
  - `POST /api/leads` -> `201`,
  - `GET /v1/partner/me/venues/oxide-chacao/leads` -> `200`,
  - `PATCH /v1/partner/me/venues/oxide-chacao/leads/{id}/status` -> `200` con `status=contacted`.

## 19) Smoke E2E web/BFF partner venue-scoped (cierre local)

Precondición usada:

- `dev:web` levantado con `PARTNER_DEV_EMAIL=owner@example.com`.
- En esta ejecución `3000` estaba ocupado; web corrió en `http://localhost:3003`.

Comando ejecutado:

- `node -e '<script smoke web bff venue-scoped>'`

Resultado observado:

- `GET /api/partner/me/venues` -> `200`.
- `POST /api/leads` -> `201` (lead `received`).
- `GET /api/partner/me/venues/oxide-chacao/leads` -> `200`.
- `PATCH /api/partner/me/venues/oxide-chacao/leads/{id}/status` -> `200` con `status=contacted` y `firstContactedAt`.

Conclusión:

- Flujo E2E local web/BFF para operación partner por `venueSlug` validado en verde bajo fallback dev.

## 20) Ejecución de gates técnicos (estado local actual)

Comandos ejecutados:

- `npx pnpm sprint4:gate`
- `npx pnpm sprint5:flow-checklist`
- `npx pnpm sprint5:kpi-gate`

Resultado:

- `sprint4:gate` -> `FAIL` en checks OIDC strict/readiness (faltan flags y config OIDC en entorno local para modo estricto).
- `sprint5:flow-checklist` -> `FAIL` por `leads SLA endpoint HTTP 401` (`/v1/admin/leads/sla-summary` sin auth admin configurada para el script).
- `sprint5:kpi-gate` -> `FAIL` por dependencia del SLA (`sla HTTP 401`).

Interpretación operativa:

- No hay regresión del flujo partner venue-scoped (smoke E2E local en verde).
- Los gates fallan por precondiciones de autenticación/entorno no satisfechas (OIDC strict + auth admin para SLA), no por errores de compilación o rutas partner.

## 21) Credenciales de prueba partner (slug importado; histórico `oxide-chacao`)

Credenciales QA generadas para entorno local:

- Email: `owner@example.com`
- Contraseña: `oxide-partner-2026`
- Venue esperado: `oxide-chacao`

Configuración usada en `dev:web`:

- `PARTNER_DEV_EMAIL=owner@example.com`
- `PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD=true`
- `PARTNER_LOCAL_LOGIN_EMAIL=owner@example.com`
- `PARTNER_LOCAL_LOGIN_PASSWORD=oxide-partner-2026`

Evidencia de acceso:

- `POST /partner/auth/login` con credenciales QA -> `303` a `/partner/gyms` + cookie `floit_partner_access_token=dev-email:owner@example.com`.
- `GET /partner/gyms` con cookie de sesión -> `200`.
- `GET /api/partner/me/venues` con cookie -> `200` con `oxide-chacao` activo.

## 22) Panel partner funcional por secciones (estado actual)

Implementado en `apps/web/src/app/partner/panel/page.tsx`:

- Menú lateral activo:
  - `Dashboard`
  - `Editar perfil`
  - `Planes y precios`
  - `Leads recibidos`
  - `Configuración`
- Acciones operativas:
  - cambio de estado de leads (`Atender`/`Cerrar`) por endpoint venue-scoped,
  - edición de perfil y gestión de fotos/portada,
  - CRUD de planes y activación/desactivación.
- Ajuste UX:
  - `venueSlug` se selecciona/carga en `Editar perfil`,
  - la sección de fotos usa el centro activo y ya no expone input directo de `venueSlug`.
- Corrección visual:
  - vistas de leads (`/partner/panel` y `/partner/leads`) forzadas a estilos claros para evitar ilegibilidad por dark mode.
