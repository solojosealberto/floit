# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Release Notes Automáticas (GitHub)

- GitHub auto-release notes are configured in `.github/release.yml`.
- Recommended workflow:
  1. Keep this file updated under `[Unreleased]`.
  2. When cutting a release, move `[Unreleased]` entries into the new version section (`[x.y.z] - YYYY-MM-DD`).
  3. Create a Git tag/release (e.g. `v0.10.0`) and enable "Generate release notes" in GitHub.
  4. PR labels will be grouped into categories defined in `release.yml`.

## [Unreleased]

### Added
- **Importación masiva de catálogo Caracas:** pipeline `scripts/venues-import/` (`normalize.mjs`, `import.mjs`, `validate.mjs`, `audit-format.mjs`); artefactos en `data/` (`venues-caracas.source.csv`, `venues-caracas.normalized.json`, `venues-geocode-cache.json`); comandos raíz `pnpm venues:normalize`, `venues:import`, `venues:load`, `venues:validate`, `venues:validate:live`, `venues:audit`. Guía: `docs/operations/VENUES_CATALOG_IMPORT.md`.
- **`POST /v1/internal/venues` ampliado:** alta/actualización idempotente por `slug` con campos opcionales de ficha (`description`, precios, contacto, `photoUrls`, scores); respuesta incluye `updated` cuando se fusiona un venue existente (`CreateInternalVenue` en `openapi/catalog.yaml`).

### Changed
- **Catálogo local (2026-05-21):** ~**95 venues** importados desde CSV de gimnasios Caracas/Miranda; **8 venues del seed demo** (`oxide-chacao`, `arena-baruta`, etc.) **eliminados de Postgres** en entornos donde se aplicó la limpieza; `SEED_ON_BOOT` no reinserta demos si la tabla `venues` no está vacía.

### Documentation
- **Catálogo e import:** `docs/index.md`, `AGENTS.md`, `README.md`, `docs/env/local.example`, `data/README.md`, `openapi/README.md`; estado operativo en `PROJECT_CONTEXT_HANDOVER.md`, `sprints.md`, `EPICS_USER_STORIES_STATUS.md`; ejemplos QA sin `oxide-chacao` en `LOCAL_TEST_CREDENTIALS.md` y `LOCALHOST_LINKS_GUIDE.md`.

### Added
- **Rebrand Fase 1 (QueGym):** marca visible **QueGym** / **QueGym Partners** / **QueGym Admin** vía `apps/web/src/lib/brand.ts`; logo textual en header, partner, admin y `@floit/ui` (`QueGymLogo`); metadata y copy transaccional; OpenAPI `info.title` con nombre de producto; sin cambio de tokens CSS, `localStorage`, cookies, eventos, `floit_verified` ni paquetes `@floit/*`.
- **Sprint UI (cierre):** **`/admin/duplicados`** (pares sospechosos + revisión local), **`/admin/moderacion-media`** (reportes de ficha + grid fotos), **`/admin/venues`** (alias catálogo), **`/partner/planes`** y **`/partner/fotos`** (redirect al panel); sección **`fotos`** en `PartnerPanelClient`.
- **Catalog admin/meta:** `GET v1/admin/meta/duplicate-suspects`, `GET v1/admin/meta/media-review`, `GET/PATCH v1/admin/venue-reports`; `GET v1/meta/taxonomy-attributes` (modalidades activas para discovery).
- **Discovery:** `/buscar` usa taxonomías activas de catalog en filtros de modalidad (fallback local).
- **Ficha gym:** tabs por sección en desktop; descripción real en resumen mobile.
- **Admin configuración:** página **`/admin/configuracion`** (sesión, flags read-only de auth del BFF, enlaces a docs operativos, accesos rápidos); helper **`apps/web/src/lib/admin-config-summary.ts`**; sidebar «Configuración» enlaza a esta ruta (deja de apuntar al dashboard). Plan: `docs/operations/ADMIN_CONFIGURATION_PAGE_PLAN.md`.
- **Admin partner-claims:** modal **Ver detalle** (`claim-detail-modal.tsx`) con resumen de centro (incl. borrador alta nueva), solicitante, evidencia (URLs / texto), historial y acciones; lista **`GET /v1/admin/partner/claims`** devuelve también **`updatedAt`** por fila.
- **Admin partner-claims (`#operaciones-y-sync`):** UI rediseñada — **`partner-service-health-panel.tsx`** (OIDC + colas + readiness), **`dlq-failures-panel.tsx`** (sync + outbox con búsqueda, selección, reintentos y modal detalle), **`ownership-partner-venue-panel.tsx`** (filtros + modal), **`ownership-audit-panel.tsx`** (filtros, fecha, CSV, paginación); auditoría carga hasta **200** eventos client-side.

### Documentation
- **Producción paso 2:** guía `PRODUCTION_ACCOUNTS_SETUP.md`, plantilla `docs/env/production.example`, `apps/web/vercel.json`; servicios partner/leads/analytics aceptan `DATABASE_URL` (Postgres/Neon) con fallback SQLite local.
- **Producción QueGym (2026-05):** plan `PRODUCTION_LAUNCH_PLAN.md`; **decisiones D1–D6 cerradas** (Vercel + Railway + Neon + Auth0 + `www.quegym.com` + Postgres para servicios stateful).
- **Rebrand QueGym (2026-05):** plan operativo `docs/operations/REBRAND_QUEGYM_PLAN.md` (Fase 1 aplicada; Fases 2–4 planificadas); sincronización de `docs/index.md`, `sprints.md`, `EPICS_USER_STORIES_STATUS.md`, `PROJECT_CONTEXT_HANDOVER.md`, `NEXT_AGENT_BRIEF.md`, `NEXT_STEPS_RECOMMENDED.md`, `WEB_ROUTES_PLATFORM.md`.
- **Panel administrativo (2026-05-10):** sincronización de **`docs/index.md`**, **`PROJECT_CONTEXT_HANDOVER.md`**, **`sprints.md`**, **`EPICS_USER_STORIES_STATUS.md`**, **`LOCALHOST_LINKS_GUIDE.md`**, **`LOCAL_TEST_CREDENTIALS.md`**, **`NEXT_AGENT_BRIEF.md`**, **`NEXT_STEPS_RECOMMENDED.md`**, **`ADMIN_CONFIGURATION_PAGE_PLAN.md`** y este changelog con **`/admin/configuracion`**, modal **Ver detalle** en **`/admin/partner-claims`**, paneles **`#operaciones-y-sync`** (`partner-service-health-panel`, `dlq-failures-panel`, `ownership-partner-venue-panel`, `ownership-audit-panel`) y lista claims con **`updatedAt`**.
- **Admin métricas y solicitudes:** actualización transversal de `docs/operations/sprints.md` (tabla Sprint 5 — UI analytics y partner-claims), `EPICS_USER_STORIES_STATUS.md` (US-6.2 + nota claims), `PROJECT_CONTEXT_HANDOVER.md` (mapa operativo analytics + claims), `WEB_ROUTES_PLATFORM.md`, `docs/index.md`, `LOCALHOST_LINKS_GUIDE.md` y este changelog para reflejar el dashboard `/admin/analytics` (gráficos MVP, detalle técnico colapsable, legibilidad en tema claro) y `/admin/partner-claims` (`partner-claims-dashboard.tsx`: KPIs, búsqueda, chips, paginación, CSV, `#operaciones-y-sync`).

### Added
- **Admin taxonomías (modalidades / amenidades):** tabla `taxonomy_attributes` en `catalog-service`, rutas `GET/POST /v1/admin/taxonomy-attributes` y `PATCH /v1/admin/taxonomy-attributes/{slug}` con `AdminApiGuard` (mismo patrón de token OIDC/`x-admin-token` que otros admin); seed opcional sincroniza slugs faltantes desde `venues.modalities` / `venues.amenities`; BFF Next.js `apps/web/src/app/api/admin/taxonomy-attributes/*` → `CATALOG_SERVICE_URL`; UI `/admin/taxonomias` (`taxonomias-client.tsx`). Contrato: `openapi/catalog.yaml` (`TaxonomyAttribute*`).

### Documentation
- Consolidación de **leads** (modal detalle admin, `GET/PATCH /v1/admin/lead/:id`, BFF `api/admin/leads/[id]`), **solicitudes partner** y **claims** (wizard `/partner/claim`, `/admin/partner-claims`, stub catalog en alta nueva, webhooks) en `PROJECT_CONTEXT_HANDOVER.md`, `WEB_ROUTES_PLATFORM.md`, `LOCALHOST_LINKS_GUIDE.md`, `EPICS_USER_STORIES_STATUS.md`, `NEXT_STEPS_RECOMMENDED.md`, `openapi/README.md`, `docs/index.md` y `LOCAL_TEST_CREDENTIALS.md`.
- Partner-service: webhook opcional **`PARTNER_CLAIM_STATUS_WEBHOOK_URL`** (y secreto **`PARTNER_CLAIM_STATUS_WEBHOOK_SECRET`**) que envía JSON `partner_claim_status_changed` al aprobar/rechazar un claim (integración con email vía Zapier/Make u otro receptor).
- E2E Playwright **`e2e/partner-claim.spec.ts`**: smoke UI `/partner/claim`; test API de claim condicionado a **`E2E_WITH_SERVICES`** (mismo patrón que leads).
- Partner claims de **centro nuevo**: el wizard envía `claimKind` + `newVenueDraft`; al aprobar, `partner-service` crea stub en **`catalog`** (`POST /v1/internal/venues`) y luego ownership + sync; admin lista tipo reclamo/alta y enlaces a ficha y panel catálogo (`openapi/partner.yaml`, `openapi/catalog.yaml`).
- Claim wizard: microcopy y pantalla de confirmación enlazan **correo = acceso** a `/partner/login` tras aprobación (fase producto post-claim).

### Fixed
- E2E smoke home: selectores alineados al hero actual (**Buscar** / **Ver todos**), no al texto «Buscar centros».
- CI `e2e-services`: espera explícita a **`partner-service`** (`4013/health`) antes de Playwright para claims/API partner.
- Next.js 15: rutas que montan `PartnerPanelClient` o leen query con `useSearchParams` van bajo `<Suspense>`: **`/partner/panel`**, **`/admin/catalogo/[venueSlug]/panel`** (wrapper `venue-panel-section.tsx`), **`/partner/configuracion/cambiar-correo`**, **`/partner/configuracion/eliminar-cuenta`** — evita error de prerender en `next build`.
- Admin: editor de ficha por centro **`/admin/catalogo/[venueSlug]/panel`** (UI compartida con `/partner/panel`), BFF **`/api/admin/catalog/venues/{venueSlug}/*`** y endpoints **`v1/admin/catalog/venues/:venueSlug/*`** en `partner-service` (delegación al primer titular o `ADMIN_CATALOG_DELEGATE_EMAIL`). Claim desde catálogo: **`/partner/claim?returnTo=/admin/catalogo`**.
- Documentación operativa: inventario de rutas web en `docs/operations/WEB_ROUTES_PLATFORM.md`; enlazado desde `docs/index.md`; guía localhost actualizada para CTAs públicos → `/partner/login`, hub `/partner/venues` y `POST /partner/logout`.
- Partner panel (`/partner/panel`, vista Configuración → Cuenta): botón «Cerrar sesión» (`POST /partner/logout`) junto a «Eliminar cuenta» en el bloque «Cuenta y acceso», manteniendo el cierre de sesión explícito sin duplicar la acción en el menú lateral.

### Changed
- Descubrimiento → partner: header global «¿Eres partner?» y banner home «Reclamar mi centro» enlazan a `/partner/login`; panel lateral «← Mis centros» vuelve a `/partner/venues` con `venueSlug` cuando aplica.
- GitHub automatic release notes configuration through `.github/release.yml`.
- Partner-to-catalog media sync MVP for gym photos using `photoUrls` (up to 12 URLs) managed from `partner-service` and exposed in `catalog-service` public detail.
- Partner photo upload endpoints by venue (`GET/POST/DELETE /v1/partner/me/venues/{venueSlug}/photos`) with multipart image validation and local static serving through `partner-service`.
- Partner photo ordering endpoint (`PATCH /v1/partner/me/venues/{venueSlug}/photos/{id}/order`) to control gallery sequence shown to clients.
- Added bulk photo reorder endpoint (`PATCH /v1/partner/me/venues/{venueSlug}/photos/reorder`) and drag-and-drop ordering support in partner panel.
- Added cover-photo endpoint (`PATCH /v1/partner/me/venues/{venueSlug}/photos/{id}/cover`) and partner-panel action to set featured image.
- Gym detail metadata now includes Open Graph cover image from the first `photoUrls` item when available.
- Partner panel now includes an OG/social preview card showing the effective cover image and text that will be shared.
- Localhost verification guide now includes executed smoke-test evidence for partner photo APIs and required sync token preconditions for partner->catalog propagation.
- Loaded sample images for all active local partner ownerships to support visual QA of partner photo workflows.
- Fixed local partner->catalog photo sync bootstrap by aligning default internal token fallback across services, enabling gym client pages to render uploaded photos without extra env setup.
- Added partner authentication foundation in web with OIDC login entry/callback and HttpOnly session token handling.
- Added strict partner gym workspace flow: `/partner/gyms` selector and venue-specific panel entry (`/partner/panel/{venueSlug}` redirecting to scoped workspace).
- Added venue-scoped partner APIs for profile, plans, and leads, plus matching BFF routes in `apps/web`.
- Added admin local credential-login flow (`/admin/login`) with HttpOnly session and explicit post-login redirect to `/admin`.
- Added admin home dashboard route (`/admin`) as operational landing page with quick access to leads, analytics, and partner claims.
- Added comparator state persistence utility (`floit-compare`) to keep selected venues (max 3) across `/buscar` and `/comparar`.
- Added compare modal search API (`GET /api/compare/search`) used by `/comparar` for in-place center selection.
- Added comparator add-center modal in `/comparar` with incremental search and non-destructive update of current selection.
- Added compare quick-selector bar in `/buscar` with active count, removable chips (`×`), `Ir a comparar`, and `Limpiar`.
- Added unified public Floit header component (`floit-main-header`) wired at app layout level.
- Added compare modal flow in `/favoritos` triggered from each venue card (`Comparar/Comparando`) with direct handoff to `/comparar`.
- Added interactive `Guardado` toggle in `/favoritos` to remove venues immediately from favorites list.
- Added local demo image bridge endpoint (`/api/demo-images/{imageId}`) to serve attached gym photos in UI.

### Changed
- Página pública `/partner/claim`: título y metadata alineados a Partners («Dar de alta o reclamar tu centro | QueGym Partners»), copy del paso 1 ordenado (un solo bloque para elegir reclamo vs alta nueva), cabecera «Tu centro en QueGym» (rebrand Fase 1), microcopy por paso (2 y 3), CTAs coherentes («Continuar al paso 2», envío «Enviar solicitud») y color primario `#0a1430` homogeneizado con `/partner/login`.
- Menú lateral de Configuración en `/partner/panel`: ítem «Cuenta» con el mismo estilo que «Mis centros», «Notificaciones», etc. (eliminado contenedor con borde/fondo extra que generaba inconsistencia visual).
- Changelog migrated to Keep a Changelog + SemVer format.
- Project governance documentation was aligned with the implemented partner-by-gym model across roadmap and product sources (`Plan maestro`, `PRD`, `Backlog`, `EPICS/US`, handover docs).
- OpenAPI contracts updated in `openapi/partner.yaml` and `openapi/catalog.yaml` to include partner-managed gym photo URLs.
- Partner global endpoints (`/v1/partner/me/profile`, `/v1/partner/me/plans*`, `/v1/partner/me/leads`) are now explicitly deprecated for operation and return `410`, enforcing venue-scoped partner workflows.
- Lead status updates now run in strict venue context via `/v1/partner/me/venues/{venueSlug}/leads/{id}/status`, and web BFF enforces venue-scoped usage with legacy route deprecated (`410`).
- Partner login UX and auth flow now use `email + password` submission against OIDC token endpoint (`grant_type=password`) with user-friendly fallback errors when the IdP/client configuration does not allow that grant.
- Localhost docs now include partner login readiness checklist (IdP, OIDC env, ownership prerequisites, internal tokens) and smoke-test evidence for the new email/password flow.
- Partner leads UI now uses a fully venue-scoped BFF endpoint for lead status updates (`/api/partner/me/venues/{venueSlug}/leads/{id}/status`).
- Legacy BFF lead-status endpoint (`/api/partner/me/leads/{id}/status`) now returns `410` to enforce venue-scoped operation.
- Added `partner-service` local CLI fixture (`seed:ownership`) to create/update partner ownership by `partnerEmail + venueSlug` for reproducible QA authorization checks.
- Added documented smoke evidence for partner venue-scoped flow highlighting pending env prerequisites for full E2E (`partner_not_configured`, `leads_integration_not_configured`).
- Standardized local internal-token fallback (`change-me-dev-only`) for partner->leads integration in `partner-service` and `leads-service`, enabling direct venue-scoped status-update smoke in dev environments without extra env wiring.
- Added successful local E2E smoke evidence for web/BFF partner venue-scoped flow (venues list, lead creation, leads inbox, and lead status patch to `contacted`) under dev fallback auth.
- Added documented local gate run evidence (`sprint4:gate`, `sprint5:flow-checklist`, `sprint5:kpi-gate`) clarifying current failures are due to missing strict OIDC/admin-auth preconditions in environment.
- Added controlled local credential-login fallback for partner QA (`PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD` + `PARTNER_LOCAL_LOGIN_*`) and validated access flow to `/partner/gyms` and venue ownership data.
- Redesigned partner panel UI to match dashboard-style reference while preserving existing CRUD capabilities (profile, plans, photos), including completion banner, KPI cards, recent leads list, and profile-status checklist.
- Enabled functional partner dashboard sections with active side-menu navigation and operational modules (`Dashboard`, `Editar perfil`, `Planes y precios`, `Leads recibidos`, `Configuración`), including venue-scoped lead state actions from the panel.
- Updated partner panel UX flow: venue selection (`venueSlug`) now lives in `Editar perfil`, while `Fotos por centro` uses the active selected venue; also removed dark-mode visual regressions from leads list views.
- Refined partner profile-edit view to match dashboard references with gallery-first composition and side publication/completion controls while keeping existing update/upload flows functional.
- Hardened environment behavior by restricting partner QA credential-login and internal-token fallback paths to non-production runtimes, and stabilized partner profile editing with controlled form state updates when switching `venueSlug`.
- Partner panel (`/partner/panel`) now includes photo management by venue (load/upload/delete) through BFF routes.
- Gym detail (`/gyms/[slug]`) now renders real gallery images from `photoUrls` synchronized in catalog.
- `/buscar` map UX refined on desktop/mobile:
  - desktop map now uses full available vertical viewport space,
  - active venue card redesigned to match latest wireframe behavior,
  - mobile map results panel supports scroll with incremental loading (`8 + 8`).
- `/buscar` map interaction improved:
  - clicking a venue card in map-side list now auto-focuses and zooms to that venue,
  - selected venue card is anchored to marker position with right-side offset so the pin remains visible.
- Updated admin server-side pages to resolve async auth headers (`await getAdminAuthHeader()`), preventing false auth failures in local QA.
- Updated localhost operations docs with persistent admin+partner local login setup and troubleshooting guidance for `/admin` partial data mode.
- Updated `/buscar` cards (desktop/map/mobile) to support direct compare toggle while preserving current filters and navigation context.
- Updated comparator page architecture to client-managed state (`comparar-client`) backed by `/api/venues/batch` and local persistence.
- Updated `/favoritos` visual design to align with discovery list language (row cards, compact metadata and chips).
- Updated app shell spacing for consistent top rhythm after removing legacy browser-like top bars.
- Updated catalog discovery summaries to include `photoUrls` in `search/home/buscar` payloads.
- Updated seed bootstrap to distribute and backfill demo `photoUrls` for all base venues.
- Updated home and `/buscar` cards to render real center photos instead of static placeholders when `photoUrls` exists.
- Updated `/buscar` and `/favoritos` card thumbnails to use the same size/crop ratio for visual consistency across listing views.
- Updated `/comparar` table sizing strategy to improve responsiveness on narrower desktop/tablet widths.

### Fixed
- Removed duplicated map detail UI by deleting legacy Leaflet popup marker card.
- Clicking empty map area now clears the previously selected venue.
- Fixed selected-card rendering glitch by showing the floating card only when marker coordinates are valid and using stable callbacks to prevent map jitter/re-mount artifacts.
- Fixed admin dashboard hard failure (`fetch failed`) by switching `/admin` data loading to partial-failure tolerant behavior (`Promise.allSettled`) with service warnings.
- Fixed local discovery outage where missing `DATABASE_URL` could leave `/buscar` without venues by enabling non-production fallback for `catalog-service`.
- Removed legacy top browser-like decorative bars (`floit.com.ve` + traffic lights) from public pages to avoid duplicated chrome.
- Fixed missing center images in home and search flows by wiring photo data end-to-end and persisting URLs per venue.

---

## [0.10.0] - 2026-04-24

### Added
- Full UI migration from Figma wireframes across user, partner, and admin screens.
- Shared UI system in `@floit/ui` with reusable primitives (`UIButton`, `UITextInput`, `UISelect`, `UICard`, `UIBadge`, `UIBanner`, `UIEmptyState`, `UITable*`).
- Home desktop wireframe implementation with functional hero search, quick zones, category chips, dynamic featured venues, and partner CTA.
- Home featured actions (`Guardar` + `Comparar`) and favorites counter in header.
- Search desktop redesign with browser shell, toolbar, active filters bar, sidebar filters, and list/map modes.
- Search mobile-first redesign with compact filters, optimized cards, empty state, and refined map mode.
- Map marker custom icon and marker popup flow with explicit `Ver ficha` CTA.

### Changed
- Global design tokens and typography integration in web (`globals.css`, Tailwind mapping).
- Visual hierarchy and interaction consistency for:
  - `/gyms/[slug]`, `/lead/confirmacion`, `/lead/estado/[token]`,
  - `/favoritos`, `/comparar`, `/partner/*`, `/admin/*`.
- Desktop map mode in `/buscar` aligned with reference design (left results panel + main map + highlight card).

### Fixed
- Pre-existing type error in `venue-badges` readonly/mutable compatibility.
- Leaflet marker rendering issue (default icon asset mismatch) by switching to custom marker icon.
- Map interaction behavior: markers now open contextual popup first (no forced immediate redirect).
- Multiple JSX structure/nesting issues introduced during incremental migration.

### Docs
- Updated migration/design documentation:
  - `docs/operations/sprints.md`,
  - `docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`,
  - `docs/ux/FIGMA_SCREEN_INVENTORY.md`,
  - `docs/ux/FIGMA_TAXONOMY_MAPPING.md`,
  - `docs/ux/FIGMA_UI_UX_BACKLOG.md`,
  - `docs/operations/LOCALHOST_LINKS_GUIDE.md`.

---

## [0.5.0] - 2026-04-23

### Added
- Full analytics MVP:
  - funnel endpoint (`/v1/metrics/funnel`),
  - timeseries endpoint (`/v1/metrics/timeseries`),
  - admin dashboard (`/admin/analytics`),
  - partner SLA summary (`/v1/admin/leads/sla-summary`).
- CTA experimentation framework (`cta_lead_entrypoint_v2`) including multivariate support.
- KPI/flow operational scripts:
  - `sprint5:kpi-gate`,
  - `sprint5:flow-checklist`,
  - `platform-preflight`.

### Changed
- `/api/events` enriched with source path metadata.

---

## [0.4.0] - 2026-04-22

### Added
- Notification queue persistence, retry, and DLQ for leads operations.
- Admin operations for notification failures and retry.
- Partner claim end-to-end flow (public + admin review).
- Partner leads inbox with ownership-based filtering and state update.
- Partner profile and plans management (`/partner/panel` + APIs).
- Partner-to-catalog sync hardening with queue + DLQ + outbox phase 1.
- Ownership operations and audit trail in admin.
- OIDC rollout readiness health signals and strict-mode validation scripts.

### Fixed
- Node 22 OIDC guard compatibility via dynamic `jose` loading.

---

## [0.3.0] - 2026-04-21

### Added
- Direct contact CTA set (WhatsApp/phone/email) on gym profile.
- Anti-spam hardening: throttling and suspicious IP detection.
- Admin leads operations page with OIDC-protected access.
- CSV export for admin leads.
- Turnstile validation in lead submission flow.
- Playwright E2E for lead flow and CI execution with required services.

### Changed
- Funnel instrumentation expanded with key interaction events.

---

## [0.2.0] - 2026-04-20

### Added
- Discovery relevance/popularity sorting and basic commercial optimization.
- Verification/trial flags and active promotions in catalog.
- Venue reporting endpoint for data quality.
- Lead persistence + public lead status tracking endpoint.
- User routes for favorites, compare, profile, and lead confirmation/status.
- Base analytics event ingestion endpoint and summary metrics.

### Changed
- SEO foundations (`metadata`, `sitemap`, `robots`) for public routes.

---

## [0.1.0] - 2026-04-19

### Added
- Project foundations:
  - pnpm monorepo workspace structure,
  - Next.js web + BFF base,
  - Nest services (`catalog`, `search`, `leads`, `partner`, `analytics`),
  - OpenAPI 3.1 contracts,
  - shared packages (`@floit/contracts`, `@floit/ui`).
- Discovery baseline:
  - catalog source of truth,
  - search facade (`/v1/search`, `/v1/meta/zones`),
  - `/buscar` list + map and URL-driven filters.

### Docs
- Architecture/process guidance through ADRs, `AGENTS.md`, and project rules.
