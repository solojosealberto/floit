# QueGym — inventario de rutas web (`apps/web`)

Referencia operativa de páginas y handlers del frontend Next.js (App Router). Marca visible: **QueGym** / **QueGym Partners** / **QueGym Admin** (`apps/web/src/lib/brand.ts`). Plan de rebranding: [`REBRAND_QUEGYM_PLAN.md`](./REBRAND_QUEGYM_PLAN.md). Los **BFF** bajo `/api/*` se documentan en [`LOCALHOST_LINKS_GUIDE.md`](./LOCALHOST_LINKS_GUIDE.md) y en `openapi/`.

## Layout global (`src/app/layout.tsx`)

- Metadata `title` con `BRAND_NAME` (**QueGym**).
- Header público compartido: `FloitMainHeader` (`floit-main-header.tsx`, copy **QueGym**) en rutas que **no** son `/admin/*` ni `/partner/*`.
- En ese header, el CTA **«¿Eres partner?»** enlaza a **`/partner/login`** (acceso para socios ya dados de alta en IdP; el alta inicial sigue en **`/partner/claim`** desde la pantalla de login o enlaces dedicados).

## Rutas públicas (usuario / discovery)

| Ruta | Archivo | Notas |
|------|---------|--------|
| `/` | `app/page.tsx` | Home; formulario hero con botón **Buscar** (GET `/buscar`) y enlace **Ver todos**; banner inferior «Reclamar mi centro» → **`/partner/login`**. |
| `/buscar` | `app/buscar/page.tsx` | Discovery + mapa. |
| `/comparar` | `app/comparar/page.tsx` | Comparador (hasta 3 centros). |
| `/favoritos` | `app/favoritos/page.tsx` | Lista desde `localStorage`. |
| `/privacidad` | `app/privacidad/page.tsx` | Legal. |
| `/gyms/[slug]` | `app/gyms/[slug]/page.tsx` | Ficha de centro. |
| `/lead/confirmacion` | `app/lead/confirmacion/page.tsx` | Post-lead. |
| `/lead/estado/[token]` | `app/lead/estado/[token]/page.tsx` | Seguimiento lead. |

## Rutas admin (`/admin/*`)

Layout propio (sin header público QueGym). Sidebar **QueGym Admin**: `app/admin/admin-sidebar.tsx` (dashboard, catálogo, leads, taxonomías, métricas, **duplicados**, **moderación**, solicitudes, **configuración**).

| Ruta | Archivo |
|------|---------|
| `/admin` | `app/admin/page.tsx` |
| `/admin/configuracion` | `app/admin/configuracion/page.tsx` — hub configuración admin: sesión local, flags read-only de auth del BFF (`ADMIN_OIDC_ACCESS_TOKEN` / `ADMIN_API_TOKEN` / `ADMIN_AUTH_REQUIRE_OIDC` / login QA), enlaces a documentación operativa y accesos rápidos; sin exponer secretos. Plan: `docs/operations/ADMIN_CONFIGURATION_PAGE_PLAN.md`. |
| `/admin/login` | `app/admin/login/page.tsx` |
| `/admin/catalogo` | `app/admin/catalogo/page.tsx` — tabla operativa de venues (`GET /v1/venues` + claims pendientes para resaltar filas). Acción **editar** → `/admin/catalogo/[venueSlug]/panel`. |
| `/admin/venues` | `app/admin/venues/page.tsx` — alias redirect → `/admin/catalogo`. |
| `/admin/duplicados` | `app/admin/duplicados/page.tsx` + `duplicados-client.tsx` — pares sospechosos (`GET /api/admin/meta/duplicate-suspects` → catalog `v1/admin/meta/duplicate-suspects`). |
| `/admin/moderacion-media` | `app/admin/moderacion-media/page.tsx` + `moderacion-media-client.tsx` — reportes de ficha (`GET/PATCH /api/admin/venue-reports*`) y grid de fotos publicadas (`GET /api/admin/meta/media-review`). |
| `/admin/catalogo/[venueSlug]/panel` | `app/admin/catalogo/[venueSlug]/panel/page.tsx` — mismo UI que el panel partner (`PartnerPanelClient` vía `venue-panel-section.tsx` con `<Suspense>`) con APIs admin (`/api/admin/catalog/venues/...` → `partner-service` `AdminApiGuard`). Sin sesión partner; requiere sesión admin + ownership delegado (ver `LOCAL_TEST_CREDENTIALS.md`). |
| `/admin/taxonomias` | `app/admin/taxonomias/page.tsx` + `taxonomias-client.tsx` — CRUD modalidades/amenidades (`GET/POST/PATCH` vía `api/admin/taxonomy-attributes*` → catalog `v1/admin/taxonomy-attributes`). |
| `/admin/leads` | `app/admin/leads/page.tsx` — tabla operativa; **Ver** abre **`LeadDetailModal`** (contacto, mensaje, consentimiento, canal entrada, dispositivo vía `x-client-user-agent`, trazabilidad IP/teléfono, historial de estado, WhatsApp al usuario, nota interna `adminNote`). APIs: lista/export/SLA vía `GET /api/admin/leads`, `GET /api/admin/leads/export`; detalle y cambio de estado vía **`GET/PATCH /api/admin/leads/[id]`** → `leads-service` **`GET/PATCH /v1/admin/lead/:id`**. |
| `/admin/analytics` | `app/admin/analytics/page.tsx` + `admin-analytics-dashboard.tsx` — métricas MVP: KPIs; filtros período (24h/7d/30d) y dispositivo; **gráficos SVG** (barras apiladas leads formulario vs WhatsApp, donut distribución dispositivo, líneas vistas de ficha vs leads); tablas zona/fuente/top gimnasios; panel colapsable **Detalle técnico** (funnel por barras, experimento CTA + barras y decisión A/B, donut SLA, mini-barras serie diaria, tablas); contraste explícito para superficie clara. |
| `/admin/partner-claims` | `app/admin/partner-claims/page.tsx` + **`partner-claims-dashboard.tsx`** (cliente) — cabecera «Claims de partners», **cinco KPIs**, búsqueda, **chips** (Todos / Pendientes / Alta nueva / Hoy), tabla con estados y paginación, **Exportar CSV**, botón **Ver detalle** → modal **`claim-detail-modal.tsx`** (centro, solicitante, evidencia, historial, acciones); debajo (**ancla `#operaciones-y-sync`**): paneles **`partner-service-health-panel`**, **`dlq-failures-panel`** (×2), **`ownership-partner-venue-panel`**, **`ownership-audit-panel`** (`admin-refresh-button`). Lista admin incluye **`updatedAt`** por ítem. Reclamo vs **alta nueva**; aprobar/rechazar **`POST /api/admin/partner/claims/[id]/status`** → `partner-service`; alta nueva → stub catalog (`POST /v1/internal/venues`). Sidebar **Solicitudes**. |

## Rutas partner (`/partner/*`)

Layout: `app/partner/layout.tsx`. Auth y redirecciones según sesión y env (ver `LOCALHOST_LINKS_GUIDE.md`).

### Páginas

| Ruta | Archivo | Rol |
|------|---------|-----|
| `/partner` | `partner/page.tsx` | Entrada workspace; redirect a panel si hay centro activo; si no, empty state «Mi cuenta» + CTA alta. |
| `/partner/login` | `partner/login/page.tsx` | Login OIDC / QA local; enlace «Primera vez» típico hacia **`/partner/claim`**. |
| `/partner/claim` | `partner/claim/page.tsx` | Wizard público alta/reclamo (`claim-wizard.tsx`); el correo del paso contacto es el de **acceso** a `/partner/login` tras aprobación; sesión server opcional para ocultar bloque login + modal informativo. Query opcional **`returnTo=`** (solo rutas que empiezan por `/admin` o `/partner`): p. ej. desde catálogo admin **`/partner/claim?returnTo=/admin/catalogo`** muestra CTA «Volver al catálogo admin» tras enviar. |
| `/partner/venues` | `partner/venues/page.tsx` | Hub multi-centro; query opcional `?venueSlug=` para selección. |
| `/partner/gyms` | `partner/gyms/page.tsx` | Redirect a `/partner/venues` (legacy). |
| `/partner/panel` | `partner/panel/page.tsx` | Panel principal (`PartnerPanelClient` envuelto en `<Suspense>` por `useSearchParams`); usar **`?venueSlug=`** para contexto; lateral incluye **«← Mis centros»** → `/partner/venues` (con `venueSlug` si aplica). |
| `/partner/panel/[venueSlug]` | `partner/panel/[venueSlug]/page.tsx` | Redirect a `/partner/panel?venueSlug=…`. |
| `/partner/planes` | `partner/planes/page.tsx` | Redirect al panel del primer centro (o `?venueSlug=`) con `section=planes`. |
| `/partner/fotos` | `partner/fotos/page.tsx` | Redirect al panel con `section=fotos` (galería dedicada). |
| `/partner/leads` | `partner/leads/page.tsx` | Bandeja leads (ownership). |
| `/partner/configuracion` | `partner/configuracion/page.tsx` | Hub configuración. |
| `/partner/configuracion/mis-centros` | `partner/configuracion/mis-centros/page.tsx` | Centros por ownership. |
| `/partner/configuracion/cambiar-correo` | `partner/configuracion/cambiar-correo/page.tsx` | Solicitud cambio correo; query opcional `venueSlug`; contenido con `useSearchParams` bajo `<Suspense>` (build App Router). |
| `/partner/configuracion/eliminar-cuenta` | `partner/configuracion/eliminar-cuenta/page.tsx` | Baja cuenta (demo-safe); misma convención Suspense + `venueSlug`. |

### Handlers (no HTML)

| Método y ruta | Archivo |
|---------------|---------|
| `POST /partner/auth/login` | `partner/auth/login/route.ts` |
| `GET /partner/auth/callback` | `partner/auth/callback/route.ts` |
| `POST /partner/logout` | `partner/logout/route.ts` |

## Contratos backend partner

- REST: `openapi/partner.yaml`.
- Claim crear: `PartnerClaimCreate` (`claimKind` `existing` \| `new`, `newVenueDraft` si es alta) → proxy web `POST /api/partner/claims`. Aprobación de `new` crea stub en `catalog` vía `POST /v1/internal/venues` antes de ownership+sync.
- Edición de ficha **desde admin** (mismas operaciones que partner por venue): rutas `v1/admin/catalog/venues/:venueSlug/*` en `partner-service` (guard admin). Proxies web: `/api/admin/catalog/venues/[venueSlug]/*` (perfil, planes, leads, fotos). Detalle operativo: `docs/operations/LOCALHOST_LINKS_GUIDE.md`.

## Mantenimiento

Si se añade una ruta nueva en `apps/web/src/app`, actualizar este archivo y los tres documentos operativos obligatorios (`sprints.md`, `EPICS_USER_STORIES_STATUS.md`, `PROJECT_CONTEXT_HANDOVER.md`) cuando cambie el comportamiento funcional.
