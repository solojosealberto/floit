# Floit — documentación de sprints (0 → 4)

Fuente única de verdad para **qué se entregó** y **dónde está en el repo**, alineado al Plan maestro, backlog y PRD. Contratos HTTP: [`openapi/`](../openapi/). ADR monorepo: [`adr/001-monorepo-and-bounded-contexts.md`](./architecture/adr/001-monorepo-and-bounded-contexts.md).

> **Nota (macOS case-insensitive):** no uses un segundo archivo `docs/SPRINTS.md`; colisiona con `sprints.md` y lo sobrescribe.

## Protocolo de fuente unica de verdad

Este archivo es una de las 3 fuentes operativas de estado junto con:

- `docs/operations/EPICS_USER_STORIES_STATUS.md`
- `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

Cuando una iteracion cambia estado funcional, los 3 archivos se actualizan en el mismo PR.

## Semantica de estados (estandar)

- `Completado`: entregado y validado segun alcance definido para la iteracion.
- `Parcial`: hay implementacion funcional, pero falta cobertura o cierre operativo.
- `Pendiente`: sin entrega funcional relevante para ese alcance.
- `Bloqueado`: no avanza por dependencia externa o condicion no resuelta.

## Checklist obligatorio de cierre de iteracion

- Que se entrego (resultado funcional y artefactos).
- Que quedo pendiente (con riesgo/impacto).
- Evidencia de pruebas (unit/integration/contract/e2e/smoke/gates).
- Impacto en riesgos operativos y mitigacion inmediata.

---

## Sprint 0 — Fundaciones

| Área | Entrega | Rutas / artefactos |
|------|---------|-------------------|
| Monorepo | pnpm workspaces | `pnpm-workspace.yaml`, `package.json` |
| Web | Next.js App Router + BFF (`app/api/*`) | `apps/web` |
| Paquetes compartidos | `@floit/contracts`, `@floit/ui` | `packages/contracts`, `packages/ui` |
| Servicios Nest | catalog, search, leads, partner, analytics (plano) | `services/*` — puertos en [`AGENTS.md`](../AGENTS.md) |
| Contratos | OpenAPI 3.1 | `openapi/` |
| Datos locales | Postgres (PostGIS) vía Docker | `docker-compose.yml`, [`docs/env/local.example`](./env/local.example) |
| Proceso | AGENTS, reglas Cursor, ADR-001 | `AGENTS.md`, `.cursor/rules/`, `docs/adr/` |

---

## Sprint 1 — Discovery local

| Área | Entrega | Rutas / notas |
|------|---------|---------------|
| Catalog | Venues como fuente de verdad (Postgres + TypeORM), seed opcional | `services/catalog`, `SEED_ON_BOOT` |
| Search | Fachada discovery → delega en catalog por query string | `services/search` (`GET /v1/search`, `GET /v1/meta/zones`) |
| Web | Lista + mapa Leaflet/OSM, filtros en URL | `apps/web/src/app/buscar/` |
| Contratos TS | `VenueSummary`, `DiscoveryResponse` | `packages/contracts` |

---

## Sprint 2 — Optimización comercial y embudo (Release 2)

### Catálogo

| Backlog / tema | Implementación |
|----------------|----------------|
| US-1.4 Relevancia | `sort=relevance`, `popularity`; scoring en listados |
| Verificación / prueba | `verificationStatus`, `allowsTrial` |
| US-4.5 Promos | `PromotionEntity`, `activePromotionTitle` |
| US-7.4 Reportes | `POST /v1/venues/:slug/reports`, `VenueReportEntity` |
| US-5.4 Duplicados | `GET /v1/meta/duplicate-suspects` |
| Contrato TS | `VenueSummary` extendido |

### Leads

| Tema | Implementación |
|------|----------------|
| Persistencia demo | SQLite + `POST /v1/leads`, `GET /v1/leads/status/:token` |
| US-7.1 Consentimiento | `consentAccepted`, `consentVersion`; checkbox en ficha; `apps/web/src/app/privacidad/page.tsx` |

### Analytics

| Tema | Implementación |
|------|----------------|
| US-6.x | `POST /v1/events`, buffer en memoria; `GET /v1/metrics/summary` |

### Web

| Ruta / pieza | Descripción |
|--------------|-------------|
| `/buscar` | Badges, favoritos (`localStorage`), promos, `exp`, `discovery_view` |
| `/favoritos`, `/comparar` | Batch venues, tabla `?c=` |
| `/gyms/[slug]` | Ficha, lead, reporte, SEO, `venue_view` |
| `/lead/*` | Confirmación, estado, encuesta → eventos |
| BFF | `api/leads`, `api/reports`, `api/venues/batch`, `api/events` |
| SEO | `metadataBase`, `sitemap.ts`, `robots.ts` |

### Ripado fino S2

OpenAPI (`openapi/README.md`), `pnpm verify`, `pnpm smoke:local`, [`docs/operations/prompts/release-2-vertical-slice.md`](./operations/prompts/release-2-vertical-slice.md).

**Sprint 2 — cerrado** para el alcance Release 2 descrito (E2E duro = hardening / S3).

---

## Sprint 3 — Conversión, operación y abuso (cerrado)

**Objetivo:** US-3.2 contacto directo, US-7.2 anti-spam, operación de leads, cumplimiento, QA.

### Entregado

| Entrega | Detalle | Ubicación |
|---------|---------|-----------|
| US-3.2 Catálogo | `contactPhone`, `contactWhatsapp`, `contactEmail` | `venue.entity.ts`, seed `DEMO_CONTACTS` |
| US-3.2 UI | CTAs + `direct_contact_click` | `gym-direct-contact.tsx` |
| US-7.3 Badges | `floit_verified` / `partner_verified` / `reference` | `gyms/[slug]/page.tsx` |
| US-7.2 Throttle | 12 req/min en `POST /v1/leads` | `@nestjs/throttler` |
| US-7.2 IP + sospecha | `clientIp`, `suspicious` (≥8 leads/h/IP) | `LeadEntity`, `leads.service.ts` |
| Admin | `GET /v1/admin/leads` + `GET/PATCH /v1/admin/lead/:id` + auth OIDC Bearer (fallback legacy local) | `admin-leads.controller.ts`, `admin-api.guard.ts` |
| Web | `/admin/leads` + **Ver** → `LeadDetailModal`; BFF `api/admin/leads/[id]` | `admin/leads/page.tsx`, `lead-detail-modal.tsx`, `api/admin/leads/[id]/route.ts` |
| robots | `Disallow: /admin/` | `robots.ts` |
| Export CSV | `GET /v1/admin/leads/export.csv` + `exportCsv` | `leads.service.ts` |
| BFF CSV | `GET /api/admin/leads/export` | `api/admin/leads/export/route.ts` |
| Analytics | `lead_persisted` → `ANALYTICS_SERVICE_URL` | `leads.service.ts` |
| Turnstile (BFF) | `TURNSTILE_SECRET_KEY` + `turnstileToken` en body | `verify-turnstile.ts`, `api/leads/route.ts` |
| Turnstile (UI) | widget Cloudflare en formulario de ficha y validación previa submit | `gym-contact-section.tsx` |
| E2E | Playwright smoke | `apps/web/e2e/`, `pnpm test:e2e` |
| E2E CI + servicios | workflow levanta Postgres + microservicios + web y corre Playwright | `.github/workflows/ci.yml` |
| Notificación webhook | `LEADS_NOTIFICATION_WEBHOOK_URL` para integración externa email/WA | `leads.service.ts` |
| Auth admin OIDC | Guard valida Bearer JWT (`issuer`/`audience` + JWKS); fallback legacy local | `admin-api.guard.ts`, `openapi/leads.yaml` |

### Pendiente (post–S3 / Sprint 4)

- Remover fallback `x-admin-token` legacy cuando OIDC esté desplegado en todos los entornos.

---

## Sprint 4 — Hardening de operación admin/notificaciones (cierre técnico completado)

**Objetivo:** resiliencia operativa en notificaciones y cierre de transición de seguridad admin.

### Entregado (iteración actual)

| Entrega | Detalle | Ubicación |
|---------|---------|-----------|
| Cola de notificaciones | `lead_received` se encola de forma persistida (SQLite) en vez de envío directo | `notification-dispatcher.service.ts`, `notification-delivery.entity.ts`, `leads.service.ts` |
| Retry exponencial | Reintentos con `LEADS_NOTIFICATION_MAX_ATTEMPTS` + `LEADS_NOTIFICATION_BASE_DELAY_MS` | `notification-dispatcher.service.ts` |
| DLQ operativa | Acumula fallos finales persistidos con cap (`LEADS_NOTIFICATION_DLQ_MAX_ITEMS`) | `notification-dispatcher.service.ts`, `notification-delivery.entity.ts` |
| Endpoints admin DLQ | `GET /v1/admin/notifications/failures` + `POST /v1/admin/notifications/retry` | `admin-leads.controller.ts`, `openapi/leads.yaml` |
| BFF admin DLQ | Proxy para listar fallos y gatillar retry | `apps/web/src/app/api/admin/notifications/*` |
| UI operación | Tabla DLQ y acción “Reintentar 50” en `/admin/leads` | `apps/web/src/app/admin/leads/page.tsx` |
| US-4.1 Claim partner (inicio) | API para solicitud de claim + revisión admin de claims | `services/partner/*`, `openapi/partner.yaml` |
| BFF claim partner | Proxy `POST /api/partner/claims` | `apps/web/src/app/api/partner/claims/route.ts` |
| UI claim partner | Formulario público `/partner/claim` para registrar solicitud | `apps/web/src/app/partner/claim/page.tsx` |
| UI admin claims | Vista `/admin/partner-claims` con listado operativo | `apps/web/src/app/admin/partner-claims/page.tsx` |
| US-4.4 Bandeja partner (inicio) | `GET /v1/partner/me/leads` filtrado por claims aprobados (ownership) | `partner-claims.controller.ts`, `partner-claims.service.ts`, `openapi/partner.yaml` |
| Auth partner (S4) | Guard OIDC partner + fallback dev (`x-partner-email`) | `partner-auth.guard.ts`, `docs/env/local.example` |
| UI partner leads | Página `/partner/leads` para revisar leads visibles por ownership | `apps/web/src/app/partner/leads/page.tsx` |
| Aprobación operativa claims | Acción aprobar/rechazar desde UI admin con proxy BFF | `apps/web/src/app/admin/partner-claims/*`, `apps/web/src/app/api/admin/partner/claims/[id]/status/route.ts` |
| Rollout OIDC-only configurable | Flags `ADMIN_AUTH_REQUIRE_OIDC` y `PARTNER_AUTH_REQUIRE_OIDC` para apagar fallbacks por entorno | `admin-api.guard.ts` (leads/partner), `partner-auth.guard.ts`, `apps/web/src/lib/*-auth-header.ts` |
| Integración ownership S2S | Partner consume `leads` vía endpoint interno por `venueSlug` (no vía admin list) | `services/leads/src/internal-leads.controller.ts`, `services/leads/src/internal-api.guard.ts`, `partner-claims.service.ts` |
| Ownership dedicado partner↔venue | Entidad persistida `partner_venue_ownerships` activada al aprobar claim | `partner-venue-ownership.entity.ts`, `partner-claims.service.ts` |
| US-4.2 Perfil partner (inicio) | `GET/PUT /v1/partner/me/profile` + UI `/partner/panel` | `partner-claims.controller.ts`, `partner-profile.entity.ts`, `apps/web/src/app/partner/panel/page.tsx` |
| US-4.3 Planes partner (inicio) | `GET/POST/PATCH /v1/partner/me/plans*` con ownership por venue | `partner-plan.entity.ts`, `partner-claims.controller.ts`, `openapi/partner.yaml` |
| BFF panel partner | Rutas `/api/partner/me/profile` y `/api/partner/me/plans*` | `apps/web/src/app/api/partner/me/*` |
| Sync partner->catalog | Endpoint interno `catalog` + push desde `partner` para reflejar perfil/planes en ficha pública | `openapi/catalog.yaml`, `venues.controller.ts`, `venues.service.ts`, `partner-claims.service.ts` |
| Hardening sync partner->catalog | Cola persistida + retry + DLQ + endpoints admin de inspección/retry | `partner-catalog-sync-*.ts`, `partner-claims.controller.ts`, `openapi/partner.yaml` |
| Outbox partner->catalog (fase 1) | Outbox persistido con DLQ/retry operativo para publicación de eventos internos hacia cola de sync | `partner-catalog-sync-outbox.entity.ts`, `partner-catalog-sync-outbox.service.ts`, `partner-claims.service.ts`, `partner-claims.controller.ts` |
| UI operación sync DLQ | Sección de fallos sync en `/admin/partner-claims` + retry vía BFF | `apps/web/src/app/admin/partner-claims/page.tsx`, `apps/web/src/app/api/admin/partner/catalog-sync/retry/route.ts` |
| Operación ownership RBAC | Listado admin de ownerships + revocación explícita partner↔venue | `partner-claims.controller.ts`, `partner-claims.service.ts`, `openapi/partner.yaml`, `apps/web/src/app/admin/partner-claims/page.tsx` |
| Auditoría ownership | Historial de revocaciones con actor/motivo/fecha + filtros por partner/venue | `partner-ownership-audit.entity.ts`, `admin-api.guard.ts`, `partner-claims.controller.ts`, `partner-claims.service.ts`, `apps/web/src/app/admin/partner-claims/page.tsx` |
| Guardrails rollout OIDC | Validación de arranque + health auth mode para staging | `services/leads/src/main.ts`, `services/partner/src/main.ts`, `services/*/health.controller.ts` |
| Health operativo de colas partner | `/health` expone estado auth + contadores de colas `catalogSync` y `catalogSyncOutbox` | `services/partner/src/health.controller.ts`, `partner-catalog-sync.service.ts`, `partner-catalog-sync-outbox.service.ts`, `openapi/partner.yaml` |
| Visibilidad operativa en admin | `/admin/partner-claims` muestra health auth/colas para checklist de activación OIDC-only | `apps/web/src/app/admin/partner-claims/page.tsx` |
| Readiness OIDC-only | `partner-service /health` expone recomendación `recommendedForStrictOidc` basada en config OIDC + salud de colas | `services/partner/src/health.controller.ts`, `openapi/partner.yaml`, `docs/operations/oidc-rollout-sprint4.md` |
| Automatización pre-check cierre S4 | Script `pnpm sprint4:readiness` valida health/readiness OIDC en leads+partner para staging | `scripts/sprint4-readiness.mjs`, `package.json`, `docs/operations/oidc-rollout-sprint4.md` |
| Automatización pruebas negativas auth | Script `pnpm sprint4:auth-negative` valida rechazo `401` de headers legacy/dev en strict mode | `scripts/sprint4-auth-negative.mjs`, `package.json`, `docs/operations/oidc-rollout-sprint4.md` |
| Gate técnico único de cierre S4 | `pnpm sprint4:gate` encadena readiness + auth-negative para validación automatizada en staging | `package.json`, `docs/operations/oidc-rollout-sprint4.md`, `docs/operations/STAGING_EVIDENCE_SPRINT4.md` |
| Compatibilidad Node 22 (OIDC guards) | Carga dinámica de `jose` para evitar `ERR_REQUIRE_ESM` en `leads` y `partner` al activar auth OIDC | `services/leads/src/admin-api.guard.ts`, `services/partner/src/admin-api.guard.ts`, `services/partner/src/partner-auth.guard.ts` |
| Runbook de activación | Checklist staging/prod + rollback OIDC-only | `docs/operations/oidc-rollout-sprint4.md` |
| DX servicios | `dev:services` incluye `partner-service` | `package.json` (root) |

### Pendiente (cierre operativo por entorno)

- Ejecutar y adjuntar evidencia formal en staging (`docs/operations/STAGING_EVIDENCE_SPRINT4.md`) con decisión `GO/NO-GO`.
- Activar `PARTNER_AUTH_REQUIRE_OIDC=true` en staging/producción y remover fallback dev tras validación final.
- Activar `ADMIN_AUTH_REQUIRE_OIDC=true` en staging/producción y retirar fallback `x-admin-token`.
- Conectar outbox partner->catalog a broker externo (NATS/Rabbit/SQS) y workers independientes (siguiente iteración de arquitectura operativa).

### Actualización operativa (2026-05-09) — claim alta nueva → catálogo

| Entrega | Detalle | Ubicación |
|---------|---------|-----------|
| Stub interno en catalog | `POST /v1/internal/venues` (token interno); creación idempotente si el slug ya existe | `services/catalog` `venues.controller.ts`, `venues.service.ts`, `openapi/catalog.yaml` |
| Claim tipado | `claimKind` `existing` \| `new` + `newVenueDraft`; persistencia en SQLite partner | `partner-claim.entity.ts`, `create-partner-claim.dto.ts`, `openapi/partner.yaml` |
| Aprobación | Antes de ownership/sync, claim `new` dispara creación de stub en catalog | `partner-claims.service.ts` |
| Web | Wizard envía payload estructurado; admin lista tipo y enlaces a ficha / panel catálogo | `claim-wizard.tsx`, `admin/partner-claims/page.tsx` |
| Web build / UX claim | Suspense en panel partner, panel admin catálogo, config cuenta y copy claim → login | `partner/panel/page.tsx`, `admin/catalogo/.../venue-panel-section.tsx`, `configuracion/*`, `claim-wizard.tsx` |
| Integración claim | Webhook JSON opcional al decidir claim (`PARTNER_CLAIM_STATUS_WEBHOOK_*`); E2E UI + API condicionada | `partner-claims.service.ts`, `apps/web/e2e/partner-claim.spec.ts`, `docs/env/local.example` |
| CI / E2E | Job `e2e-services` espera **`4013/health`** (partner); smoke Playwright alineado al hero real (**Buscar** / **Ver todos**) | `.github/workflows/ci.yml`, `apps/web/e2e/smoke.spec.ts` |

---

## Sprint 5 — Analítica y dashboard MVP (en curso)

**Objetivo:** cerrar US-6.1/US-6.2 con métricas de funnel accionables para operación/growth y base para beta.

### Entregado (iteración inicial)

| Entrega | Detalle | Ubicación |
|---------|---------|-----------|
| Métricas de funnel en analytics | Nuevo endpoint `GET /v1/metrics/funnel` con ventana temporal, funnel, tasas y segmentación | `services/analytics/src/events.controller.ts`, `openapi/analytics.yaml` |
| Segmentación operativa | Agregación por `zone`, `device`, `source` y top venues | `services/analytics/src/events.controller.ts` |
| Enriquecimiento de eventos BFF | Proxy `/api/events` agrega `source` (path de origen) para lectura en dashboard | `apps/web/src/app/api/events/route.ts` |
| Instrumentación funnel adicional | Nuevos eventos `filter_apply`, `compare_open`, `cta_click` | `apps/web/src/app/buscar/buscar-client.tsx`, `apps/web/src/app/comparar/compare-view-tracker.tsx`, `apps/web/src/app/gyms/[slug]/gym-direct-contact.tsx`, `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx` |
| Dashboard admin MVP | Nueva vista `/admin/analytics` con KPIs, funnel y segmentación por ventana (24h/7d/30d) | `apps/web/src/app/admin/analytics/page.tsx` |
| Persistencia durable analytics | Eventos analytics migrados de buffer en memoria a SQLite (`TypeORM`) con retención operativa | `services/analytics/src/app.module.ts`, `services/analytics/src/analytics-event.entity.ts`, `services/analytics/src/events.controller.ts`, `docs/env/local.example` |
| Serie temporal del funnel | Nuevo endpoint `GET /v1/metrics/timeseries` y tabla diaria en dashboard admin | `services/analytics/src/events.controller.ts`, `openapi/analytics.yaml`, `apps/web/src/app/admin/analytics/page.tsx` |
| SLA de respuesta partner | Leads registra `firstContactedAt`, expone `GET /v1/admin/leads/sla-summary` y dashboard muestra KPI de atención <=120m | `services/leads/src/lead.entity.ts`, `services/leads/src/leads.service.ts`, `services/leads/src/admin-leads.controller.ts`, `apps/web/src/app/admin/analytics/page.tsx`, `openapi/leads.yaml` |
| Operación partner sobre estado de leads | Endpoint partner para marcar lead `contacted/closed` con validación de ownership y puente interno S2S hacia leads; web usa BFF venue-scoped y depreca route legacy con `410` | `services/partner/src/partner-claims.controller.ts`, `services/partner/src/partner-claims.service.ts`, `services/leads/src/internal-leads.controller.ts`, `apps/web/src/app/api/partner/me/venues/[venueSlug]/leads/[id]/status/route.ts`, `apps/web/src/app/api/partner/me/leads/[id]/status/route.ts`, `apps/web/src/app/partner/leads/page.tsx`, `openapi/partner.yaml` |
| US-6.3 experimentación CTA (inicio) | A/B `cta_lead_entrypoint_v2` en ficha (`membership` vs `trial`) con `experiment_assignment`, métricas por variante en analytics y visualización en dashboard admin | `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx`, `services/analytics/src/events.controller.ts`, `apps/web/src/app/admin/analytics/page.tsx`, `openapi/analytics.yaml` |
| US-6.3 decisión automática A/B | Endpoint dedicado de experimento + criterios de estabilidad/uplift para decisión `GO/NO-GO` en dashboard y gate técnico | `services/analytics/src/events.controller.ts`, `openapi/analytics.yaml`, `apps/web/src/app/admin/analytics/page.tsx`, `scripts/sprint5-kpi-gate.mjs` |
| US-6.3 multivariante CTA | Evolución a `cta_lead_entrypoint_v2` con variante adicional `whatsapp_first` y evaluación automática comparada vs baseline `membership` | `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx`, `services/analytics/src/events.controller.ts`, `apps/web/src/app/admin/analytics/page.tsx`, `scripts/sprint5-kpi-gate.mjs`, `openapi/analytics.yaml` |
| Gate técnico KPI Sprint 5 | `pnpm sprint5:kpi-gate` valida umbrales mínimos de funnel + SLA + tamaño mínimo de muestra A/B por variante | `scripts/sprint5-kpi-gate.mjs`, `package.json` |
| Checklist técnico pre-E2E | `pnpm sprint5:flow-checklist` valida disponibilidad de servicios/endpoints antes de prueba integral | `scripts/sprint5-flow-checklist.mjs`, `package.json`, `docs/operations/STAGING_EVIDENCE_SPRINT5.md` |
| Navegación operativa | Links a analytics desde admin leads/claims | `apps/web/src/app/admin/leads/page.tsx`, `apps/web/src/app/admin/partner-claims/page.tsx` |
| Malla QA capability end-to-end | Cobertura `buscar -> ficha -> comparar -> lead` con fixtures reutilizables, unit/integration(testcontainers)/contract/e2e y comando único `pnpm test:capability` | `tests/fixtures/capability-search-profile-compare-lead.ts`, `tests/contracts/openapi-capability.contract.test.ts`, `services/catalog/test/capability-search-profile-compare.integration.spec.ts`, `apps/web/e2e/capability-search-profile-compare-lead.spec.ts`, `apps/web/e2e/lead-flow.spec.ts`, `docs/operations/TEST_MATRIX_SEARCH_PROFILE_COMPARE_LEAD.md`, `package.json` |
| Preflight de plataforma para despliegue/prueba | Script operativo para validar runtime, remote git y health de servicios antes de ejecutar gates/tests | `scripts/platform-preflight.mjs`, `package.json`, `docs/operations/DEPLOY_TEST_RUNBOOK.md` |
| Estabilización de validación local | Fixes para ejecución estable de flujo lead y pipeline de pruebas (DTO runtime, selector E2E robusto, bootstrap integration sin seed side-effects, soporte token admin en checklists locales) | `services/leads/src/leads.controller.ts`, `apps/web/e2e/lead-flow.spec.ts`, `services/catalog/test/capability-search-profile-compare.integration.spec.ts`, `services/catalog/src/venues/venues.controller.ts`, `scripts/sprint5-flow-checklist.mjs`, `scripts/sprint5-kpi-gate.mjs` |
| Partner claim — UX alta/reclamo (2026-05-09) | Asistente multi-paso en cliente (`claim-wizard.tsx`): paso 1 con bloque «Ya tienes una cuenta» + enlace `/partner/login` y bloque «Aún no tienes cuenta» con elección reclamo/registro; pasos 2–3 con datos de centro (búsqueda vía `/api/compare/search` o formulario nuevo), contacto y pantalla de confirmación; envío sigue `POST /api/partner/claims` con `evidence` texto (registro nuevo usa slug sintético `alta-*`). Stepper Tipo/Centro/Contacto solo visible en pasos 2–3 (oculto en inicio). Sesión partner detectada en servidor (`getPartnerAuthHeader`): oculta bloque de login y muestra modal nativo «Sesión partner activa» (una vez por pestaña vía `sessionStorage`). | `apps/web/src/app/partner/claim/page.tsx`, `apps/web/src/app/partner/claim/claim-wizard.tsx` |
| Partner entry — sin centros (2026-05-09) | Vista «Mi cuenta» cuando no hay ownership activo: empty state, CTA «Agregar mi primer centro», beneficios Floit y enlace a `/partner/venues`; cabecera tipo workspace y acceso a configuración. | `apps/web/src/app/partner/page.tsx` |
| Navegación pública → login partner (2026-05) | Header global «¿Eres partner?» y banner home «Reclamar mi centro» enlazan a **`/partner/login`** en lugar del claim directo; reduce fricción para socios con cuenta. Inventario de rutas web documentado en `docs/operations/WEB_ROUTES_PLATFORM.md`. | `apps/web/src/app/floit-main-header.tsx`, `apps/web/src/app/page.tsx` |
| Panel partner → hub centros (2026-05) | En **`/partner/panel`** lateral: botón **«← Mis centros»** navega a **`/partner/venues`** preservando **`venueSlug`** en query cuando existe. | `apps/web/src/app/partner/panel/page.tsx` |

### Actualización UI — `/admin/analytics` y `/admin/partner-claims` (2026-05-09)

| Entrega | Detalle | Ubicación |
|---------|---------|-----------|
| Métricas — gráficos alineados a diseño | Barras apiladas leads formulario vs WhatsApp (leyenda + rejilla); **donut** distribución por dispositivo con leyenda; **líneas** vistas de ficha vs leads con rejilla horizontal, fechas en eje e inferior y leyenda integrada | `apps/web/src/app/admin/analytics/admin-analytics-dashboard.tsx` |
| Métricas — detalle técnico | Bloque `<details>` con funnel por **barras horizontales**, tabla + barras experimento CTA, donut SLA, barras resumen A/B en decisión GO/NO-GO, mini-barras leads persistidos/día, tablas de soporte; ritmo visual alineado a KPIs | mismo archivo |
| Métricas — legibilidad | Textos y tablas con contraste explícito sobre fondo claro (`text-neutral-*`, `[color-scheme:light]` en contenedor) para evitar herencia de foreground claro con `prefers-color-scheme: dark` | `admin-analytics-dashboard.tsx`, `admin/analytics/page.tsx` |
| Solicitudes — dashboard principal | **Claims de partners**: KPIs (total, pendientes, alta nueva, aprobados, rechazados), búsqueda libre, chips Todos / Pendientes / Alta nueva / Hoy, tabla con icono centro, fechas absolutas + relativas, badges de estado, filas pendientes resaltadas, paginación (10 ítems), **Exportar CSV** del listado filtrado, enlaces rápidos y botón a operaciones avanzadas | `apps/web/src/app/admin/partner-claims/partner-claims-dashboard.tsx` |
| Solicitudes — página y operaciones | Vista servidor: dashboard cliente arriba; debajo **Estado partner-service**, DLQ sync/outbox, ownership y auditoría con ancla **`#operaciones-y-sync`**; textos e inputs forzados a tema claro legible | `apps/web/src/app/admin/partner-claims/page.tsx`, `claim-status-actions.tsx` |

### Pendiente (resto Sprint 5)

- Añadir variantes adicionales de experimento (copy corto vs largo) sobre baseline actual multivariante.
- Definir gate beta con umbrales KPI (`QIR`, `search->profile`, `profile->lead`, `SLA`) en staging.
- Ejecutar `pnpm sprint5:kpi-gate` contra analytics en staging y registrar resultado como criterio de entrada a beta.
- Ejecutar prueba integral guiada (`pnpm sprint5:flow-checklist` + checklist manual) y completar `docs/operations/STAGING_EVIDENCE_SPRINT5.md`.

---

## Sprint 8–10 — Migración UI/UX desde wireframes Figma (implementación completada)

**Objetivo:** aplicar el nuevo lenguaje visual en slices verticales sin romper contratos ni flujos clave (`buscar -> ficha -> comparar -> lead`, partner y admin).

### Entregado (iteración actual)

| Entrega | Detalle | Ubicación |
|---------|---------|-----------|
| Fundación de design system compartido | Tokens y componentes base (`UIButton`, `UITextInput`, `UISelect`, `UICard`, `UIBadge`, `UIEmptyState`, `UITable*`, `UIBanner`) en paquete reusable | `packages/ui/src/*`, `packages/ui/src/index.tsx` |
| Integración global de tokens | Variables Floit UI cargadas en web y mapeadas en Tailwind | `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts` |
| Discovery migrado | `/buscar`, `/favoritos`, `/comparar` actualizados con componentes `@floit/ui` manteniendo lógica | `apps/web/src/app/buscar/buscar-client.tsx`, `apps/web/src/app/favoritos/page.tsx`, `apps/web/src/app/comparar/page.tsx` |
| Ficha/lead migrados | Ajustes visuales en ficha, contacto directo y vistas de lead | `apps/web/src/app/gyms/[slug]/*`, `apps/web/src/app/lead/confirmacion/page.tsx`, `apps/web/src/app/lead/estado/[token]/page.tsx` |
| Partner migrado | Claim público, panel y bandeja de leads con tablas/banners/cards unificados | `apps/web/src/app/partner/claim/page.tsx`, `apps/web/src/app/partner/panel/page.tsx`, `apps/web/src/app/partner/leads/page.tsx` |
| Admin migrado | Leads, claims y analytics con UI consistente de cards/tablas/banners | `apps/web/src/app/admin/leads/page.tsx`, `apps/web/src/app/admin/partner-claims/*`, `apps/web/src/app/admin/analytics/page.tsx` |
| Home admin operativa | Nueva ruta `/admin` como dashboard de backoffice con KPIs, alertas y accesos rápidos, alineada al diseño de referencia | `apps/web/src/app/admin/page.tsx` |
| Login admin local con redirección | Pantalla `/admin/login` y autenticación local por formulario; redirección post-login hacia `/admin` | `apps/web/src/app/admin/login/page.tsx`, `apps/web/src/app/admin/auth/login/route.ts`, `apps/web/src/lib/admin-session.ts` |
| Robustez dashboard admin | Dashboard `/admin` con carga tolerante a fallos parciales (`Promise.allSettled`) para evitar error global `fetch failed` | `apps/web/src/app/admin/page.tsx` |
| Home desktop alineada a wireframe | Landing `/` rediseñada (hero, buscador principal, categorías, destacados, banner partner) | `apps/web/src/app/page.tsx` |
| Home funcional conectada a datos reales | Buscador con `q` + `zone`, geolocalización (`lat/lng`), categorías a filtros reales, destacados dinámicos (`sort=popularity`) y acciones rápidas (`Guardar`/`Comparar`) | `apps/web/src/app/page.tsx`, `apps/web/src/app/home-location-button.tsx`, `apps/web/src/app/home-featured-actions.tsx` |
| Header home con acceso a favoritos | Contador en tiempo real de favoritos en header (`Favoritos (n)`) para acceso directo a `/favoritos` | `apps/web/src/app/home-favorites-link.tsx`, `apps/web/src/app/page.tsx` |
| Página `/buscar` alineada a wireframe desktop | Nuevo layout browser-shell + barra superior + barra lateral completa (zona, tipo, precio, modalidades, amenidades) + vista lista/mapa | `apps/web/src/app/buscar/buscar-client.tsx` |
| Sidebar de `/buscar` funcional | Filtros aplican query params reales (`zone`, `venue_type`, `modality`, `budget_*`) y amenidades en filtro local sobre resultados | `apps/web/src/app/buscar/buscar-client.tsx` |
| Refinamiento final de mapa `/buscar` (desktop + mobile) | Mapa desktop a altura completa de viewport, tarjeta activa rediseñada, deselección al click en mapa vacío, lista mobile scrolleable con paginación incremental `8 + 8` y eliminación de popup legacy duplicado | `apps/web/src/app/buscar/buscar-client.tsx`, `apps/web/src/app/buscar/discovery-map.tsx` |
| Interacción avanzada de mapa `/buscar` | Click en ficha del listado (modo mapa) enfoca+zoom al centro, tarjeta anclada al marcador con offset lateral derecho para no tapar el pin y corrección de visualización por posicionamiento (render condicionado + callbacks estables) | `apps/web/src/app/buscar/buscar-client.tsx`, `apps/web/src/app/buscar/discovery-map.tsx` |
| Comparador visual alineado a referencia | `/comparar` rediseñado con layout tabular por secciones, encabezado por centro y CTAs por columna | `apps/web/src/app/comparar/comparar-client.tsx`, `apps/web/src/app/comparar/page.tsx` |
| Persistencia de comparación cross-page | Estado de centros a comparar guardado en `localStorage` (máx. 3), compartido entre `/buscar` y `/comparar` | `apps/web/src/lib/floit-compare.ts`, `apps/web/src/app/buscar/buscar-client.tsx`, `apps/web/src/app/comparar/comparar-client.tsx` |
| Modal “Añadir centro” en comparador | Búsqueda incremental en modal para agregar centros sin perder la comparación actual | `apps/web/src/app/comparar/comparar-client.tsx`, `apps/web/src/app/api/compare/search/route.ts` |
| Selector rápido de comparación en buscador | Barra flotante en `/buscar` con chips seleccionados, remoción rápida (`×`), `Ir a comparar` y `Limpiar` | `apps/web/src/app/buscar/buscar-client.tsx` |
| Header global del flujo principal | Header Floit unificado en layout para navegación transversal (`buscar/comparar/favoritos/privacidad`) y remoción de header duplicado en home | `apps/web/src/app/layout.tsx`, `apps/web/src/app/floit-main-header.tsx`, `apps/web/src/app/page.tsx` |
| Eliminación de barra superior legacy | Removido bloque visual tipo browser (`floit.com.ve` + semáforos) de vistas públicas para consistencia UI | `apps/web/src/app/page.tsx`, `apps/web/src/app/buscar/buscar-client.tsx` |
| Favoritos rediseñado | `/favoritos` migrado a layout de referencia (cabecera, chips, toolbar y list rows) manteniendo datos reales desde favoritos locales | `apps/web/src/app/favoritos/page.tsx` |
| Comparación contextual desde favoritos | Cada ficha de favoritos permite `Comparar/Comparando` con apertura de modal en la misma página y enlace a `/comparar` | `apps/web/src/app/favoritos/page.tsx`, `apps/web/src/lib/floit-compare.ts` |
| Gestión activa de guardados en favoritos | Badge `Guardado` pasa a acción de deselección para eliminar centros de favoritos en tiempo real | `apps/web/src/app/favoritos/page.tsx`, `apps/web/src/lib/floit-favorites.ts` |
| Persistencia y distribución de fotos demo | Se asignan y persisten `photoUrls` para todos los centros seed y se exponen vía endpoint de imágenes demo | `services/catalog/src/seed/seed.service.ts`, `apps/web/src/app/api/demo-images/[imageId]/route.ts` |
| Render real de fotos en discovery/home | Home y `/buscar` consumen `photoUrls` de discovery y muestran imágenes reales en cards/lista/mapa | `services/catalog/src/venues/venues.service.ts`, `apps/web/src/app/page.tsx`, `apps/web/src/app/buscar/buscar-client.tsx` |
| Ajuste fino de imágenes cross-view | Proporciones y recorte de miniaturas alineadas entre `/buscar` y `/favoritos` (`h-20 w-24`, `object-center`) para consistencia visual | `apps/web/src/app/buscar/buscar-client.tsx`, `apps/web/src/app/favoritos/page.tsx` |
| Comparador más responsive | Tabla de `/comparar` adaptada al ancho disponible con columnas dinámicas y mejor comportamiento en viewport reducido | `apps/web/src/app/comparar/comparar-client.tsx` |
| Resiliencia de catálogo en local | `catalog-service` usa fallback local de `DATABASE_URL` en no-producción para evitar caída total de discovery si falta env | `services/catalog/src/app.module.ts` |
| Smoke funcional local | Render validado de rutas clave migradas en localhost | `/buscar`, `/gyms/[slug]`, `/comparar`, `/partner/*`, `/admin/*` |

### Evidencia de cierre local (Sprint 10)

- `Completado` Smoke funcional E2E local con flujo `buscar -> ficha -> comparar -> lead submit -> confirmación -> estado`.
- `Completado` Typecheck web en verde tras corrección de compatibilidad readonly/mutable en `venue-badges`.
- `Completado` Homogeneización visual en rutas admin/ficha pendientes (`/admin/analytics`, `/gyms/[slug]`).
- `Completado` Home wireframe funcional con navegación y filtros operativos (`q`, `zone`, `venue_type/modality`, geolocalización y acciones en destacados).
- `Completado` Home con acceso rápido a favoritos en header y contador vivo por `localStorage`.
- `Completado` `/buscar` actualizada al diseño de referencia con barra lateral funcional y modo lista/mapa.
- `Completado` Mapa `/buscar` refinado: solo una ficha activa (sin popup legacy), deselección en mapa vacío, mapa desktop full-height y listado mobile con `Mostrar 8 más`.
- `Completado` Modo mapa `/buscar` con focus+zoom automático al seleccionar fichas de la lista y tarjeta contextual posicionada a la derecha del marcador para mantener visible el icono.
- `Completado` Corrección de error visual de la ficha anclada al mapa (posición inválida/flicker) mediante render condicionado a coordenadas válidas y callbacks estables.
- `Completado` Backend partner/catalog extendido para fotos de centros (MVP URL-based): `photoUrls` en perfil partner, sincronización interna `partner-sync` y exposición en detalle público de catálogo.
- `Completado` Backend partner con upload real de fotos por venue (multipart `jpeg/png/webp`, límite 5MB), almacenamiento local y gestión (`listar/subir/eliminar`) con ownership y sync automático a catálogo.
- `Completado` Ordenamiento manual de fotos por partner (botones `↑/↓` + drag-and-drop en panel), persistido en backend y reflejado en la galería pública de `gyms/[slug]`.
- `Completado` Selección de foto de portada por partner y propagación a metadata Open Graph en la ficha pública.
- `Completado` Login partner web base (`/partner/login` + callback + cookie HttpOnly) y selector estricto de centro (`/partner/gyms`), con acceso al workspace por `venueSlug`.
- `Completado` API partner ampliada a contexto por centro (`/v1/partner/me/venues/{venueSlug}/profile|plans|leads`) y BFF equivalente en `apps/web`.
- `Completado` Endurecimiento de rutas partner globales legacy: endpoints globales (`/me/profile`, `/me/plans`, `/me/plans/{id}`, `/me/leads`) deprecados y respuesta `410`; operación oficial solo venue-scoped.
- `Completado` Login partner web migrado a `email + contraseña` sobre OIDC (`grant_type=password`) con manejo de errores de IdP y fallback UX explícito cuando el grant no está habilitado.
- `Completado` Smoke de login partner (`/partner/login`, `POST /partner/auth/login`) con validación de redirecciones controladas y mensajes UX para credenciales faltantes, grant no habilitado y configuración incompleta de IdP.
- `Completado` UI partner leads migrada a actualización de estado por endpoint BFF totalmente venue-scoped (`/api/partner/me/venues/{venueSlug}/leads/{id}/status`), eliminando dependencia operativa del adaptador global.
- `Completado` Fixture local reproducible para ownership partner↔venue (`seed:ownership`) para validar permisos por `venueSlug` (activar/revocar) en QA.
- `Completado` Smoke funcional del bloque partner venue-scoped documentado en localhost guide; hallazgo operativo: entorno web sin auth partner (`partner_not_configured`) e integración partner->leads sin token interno (`leads_integration_not_configured`) impiden cierre E2E hasta completar configuración.
- `Completado` Fallback local S2S partner->leads (`change-me-dev-only`) homologado entre `partner-service` y `leads-service`; smoke directo create->list->patch quedó en verde (`status=contacted`).
- `Completado` Smoke E2E web/BFF de operación partner venue-scoped en verde (`GET venues`, `POST lead`, `GET leads`, `PATCH status=contacted`) usando fallback dev en `dev:web`.
- `Completado` Re-ejecución de gates técnicos locales (`sprint4:gate`, `sprint5:flow-checklist`, `sprint5:kpi-gate`) con evidencia de fallos por precondiciones de entorno: OIDC strict no activo/configurado y SLA admin sin auth (`401`).
- `Completado` Login partner local por credenciales QA habilitado para pruebas (`owner@example.com` / `oxide-partner-2026`) con sesión HttpOnly dev (`dev-email:*`) y acceso validado a `oxide-chacao`.
- `Completado` Rediseño visual del `partner/panel` alineado a referencia de dashboard (sidebar, cabecera con CTAs, banner de completitud, KPIs, leads recientes y estado de perfil) manteniendo operativas las secciones de perfil, planes y fotos.
- `Completado` Navegación lateral funcional en `partner/panel` con secciones activas (`Dashboard`, `Editar perfil`, `Planes y precios`, `Leads recibidos`, `Configuración`) y acciones reales de leads (`Atender`/`Cerrar`) por `venueSlug`.
- `Completado` Ajuste UX panel partner: `venueSlug` movido a la sección `Editar perfil` (selector/carga de centro) y removido de `Fotos por centro`; vista `Leads recibidos` forzada a estilos claros para evitar contraste de dark mode.
- `Completado` Pulido visual de `Editar perfil` siguiendo referencia (galería superior, tarjeta lateral de estado/completitud y guardado principal) manteniendo operación real de perfil/fotos y lectura clara en modo oscuro del sistema.
- `Completado` Hardening técnico post-auditoría: fallback de login QA partner y tokens internos dev restringidos a entornos no productivos; formulario de perfil partner migrado a estado controlado para evitar inconsistencias al cambiar `venueSlug`.
- `Completado` Dashboard home admin implementado en `/admin` con navegación lateral y alertas operativas, manteniendo enlaces a `leads`, `analytics` y `partner-claims`.
- `Completado` Login admin local por formulario con redirección post-login a `/admin` y protección de rutas admin sin sesión (`/admin/login`).
- `Completado` Corrección de 401 intermitente en pantallas admin: llamadas server-side actualizadas para resolver header auth async (`await getAdminAuthHeader()`).
- `Completado` Corrección de error `Dashboard admin - No se pudo cargar: fetch failed`: dashboard admin ahora levanta con datos parciales y advertencias en lugar de fallar completo.
- `Completado` Comparador rediseñado según referencia visual y operativo por bloques (información básica, servicios, amenidades, acciones).
- `Completado` Persistencia de selección de comparación (máx. 3) entre `/buscar` y `/comparar` con estado local estable.
- `Completado` Modal de añadir centros en `/comparar` con búsqueda incremental (`/api/compare/search`) y mantenimiento de selección previa.
- `Completado` Selector rápido en `/buscar` con chips removibles (`×`) para gestionar la comparación sin salir de resultados.
- `Completado` Corrección de caída silenciosa en discovery local cuando `catalog-service` no tenía `DATABASE_URL`, habilitando fallback dev en `catalog`.
- `Completado` Header global Floit aplicado en flujo principal y eliminación de barra superior legacy tipo browser en pantallas públicas.
- `Completado` `/favoritos` rediseñado para mantener lenguaje visual de discovery (toolbar, chips y tarjetas de lista).
- `Completado` Comparación iniciable desde cada ficha de favoritos con modal contextual, sin botón global de `Comparar seleccionados`.
- `Completado` Acción `Guardado` en favoritos habilitada para deselección/eliminación inmediata de la lista.
- `Completado` Distribución de imágenes adjuntas entre todos los centros demo (`2` por centro) con persistencia en Postgres (`venues.photoUrls`).
- `Completado` Home, `/buscar` y ficha de centro renderizan fotos reales en lugar de placeholders, consumiendo `photoUrls` desde discovery/catalog.
- `Completado` Homologación visual de miniaturas entre favoritos y búsqueda, evitando saltos de proporción/encuadre entre vistas.
- `Completado` Tabla de comparación ajustada para mejor responsividad horizontal sin romper jerarquía visual.
- `Completado` Simplificación funcional de `/gyms/[slug]`: se removieron cajas intermedias de contacto y los modales de `Solicitar información` y `Reportar datos incorrectos` se activan desde CTAs superiores.
- `Completado` Ajuste de CTA WhatsApp en `/gyms/[slug]`: el botón vuelve a redirigir directo al número del centro (sin abrir modal), conservando modales solo para contacto/reportes.
- `Completado` Corrección UX de mapa en `/buscar` (desktop): modo `Mapa` sin sidebar lateral de filtros, filtros concentrados en menú superior y acciones compactas en tarjetas para evitar truncado de nombres.
- `Completado` Botón `Filtros` operativo en `/buscar` modo `Mapa` desktop con panel desplegable superior (zona/tipo/precio/modalidad) sin reintroducir sidebar fija.
- `Completado` Ajuste visual fino en tarjetas del listado lateral de `Mapa` desktop: iconografía compacta para `comparar`/`guardar` (evita corte del nombre), estado guardado con estrella blanca sobre fondo negro y layout `30/70` (barra/mapa).
- `Pendiente` Evidencia manual en staging con checklist visual final por dispositivo (desktop/mobile) para cierre release.

---

## Sprint 11 — Cierre UI de páginas faltantes (completado — ciclo UI mayo 2026)

**Objetivo del sprint:** completar creación y actualización visual de páginas pendientes del producto para cerrar consistencia UX end-to-end antes de abrir nuevo alcance funcional.

### Scope of work vigente (obligatorio)

- Este sprint se enfoca **solo** en actualización UI/UX de páginas no creadas o no mejoradas.
- Si surge trabajo fuera de este alcance, se documenta en backlog como pendiente y no desplaza el foco del sprint.
- La implementación se hace por iteraciones con referencias visuales provistas durante el avance.

### Plan priorizado (P1/P2/P3)

| Prioridad | Página / sección | Estado actual | Acción de sprint |
|---|---|---|---|
| P1 | `/partner` | **Hecha** | Landing workspace partner (`partner/page.tsx`). |
| P1 | `/partner/configuracion` | **Hecha** | Hub + subpáginas cuenta/centros/correo/baja. |
| P1 | `/partner/planes` | **Hecha** | Redirect al panel `?section=planes` (`partner/planes/page.tsx`). |
| P1 | `/partner/fotos` | **Hecha** | Redirect al panel `?section=fotos` (galería dedicada en `PartnerPanelClient`). |
| P1 | `/admin/venues` | **Hecha** | Alias → `/admin/catalogo` (`admin/venues/page.tsx`). |
| P2 | `/admin/taxonomias` | **Hecha** | CRUD modalidades/amenidades vía catalog + BFF; ver US-5.2 en `EPICS_USER_STORIES_STATUS.md`. |
| P2 | `/admin/duplicados` | **Hecha** | UI pares sospechosos + revisión local (`admin/duplicados/*`, API `v1/admin/meta/duplicate-suspects`). |
| P2 | `/admin/moderacion-media` | **Hecha** | Reportes de ficha + grid fotos (`admin/moderacion-media/*`, APIs `v1/admin/venue-reports`, `v1/admin/meta/media-review`). |
| P3 | `/checkout` | No creada (`404`) | Mantener fuera de MVP; definir placeholder/ruta informativa si se requiere navegación. |
| P3 | `/reservas` | No creada (`404`) | Mantener fuera de MVP; definir placeholder/ruta informativa si se requiere navegación. |

### Criterios de salida del sprint

- Todas las páginas P1 y P2 creadas o integradas visualmente.
- Navegación coherente entre flujo público, partner y admin.
- Estilo visual consistente con componentes y patrones ya usados (`@floit/ui`).
- Estado actualizado en:
  - `docs/operations/sprints.md`
  - `docs/operations/EPICS_USER_STORIES_STATUS.md`
  - `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

### Avance de iteración (Partner Configuración)

- `Completado` Integración de `Configuración` dentro de `/partner/panel` con navegación lateral por sub-vistas (`Cuenta`, `Mis centros`, `Notificaciones`, `Facturación`, `Privacidad`, `Ayuda y soporte`) y layout alineado al diseño de referencia desktop.
- `Completado` Creación de páginas dedicadas de configuración partner: `/partner/configuracion`, `/partner/configuracion/mis-centros`, `/partner/configuracion/cambiar-correo`, `/partner/configuracion/eliminar-cuenta`.
- `Completado` `Mis centros` conectado a datos reales de ownership (`/v1/partner/me/venues`), incluyendo cambio de contexto hacia `/partner/panel?venueSlug=...`, CTA a edición de perfil y acceso a ficha pública.
- `Completado` Flujo funcional `Cambiar correo` con validación y endpoint BFF `POST /api/partner/me/account/email` (estado `pending_verification` en entorno demo sin mutar ownership activo).
- `Completado` Flujo funcional `Eliminar cuenta` con validación de confirmación y endpoint BFF `POST /api/partner/me/account/delete` que cierra sesión partner como acción segura en demo.
- `Completado` Smoke local de rutas y APIs partner configuración (`200` en vistas; `200/400/200` en casos válidos e inválidos de APIs de cuenta) documentado en esta iteración.
- `Completado` Nueva página operativa `/partner/venues` como hub de centros partner con acceso rápido por centro a `Dashboard`, `Editar perfil`, `Planes`, `Leads`, `Configuración` y `Ver público`.
- `Completado` Compatibilidad de navegación: `/partner/gyms` mantiene acceso legacy redirigiendo a `/partner/venues` (preserva `venueSlug` en query param).

### Avance de iteración (Admin taxonomías)

- `Completado` CRUD de modalidades y amenidades en **`/admin/taxonomias`** (`taxonomias-client.tsx`), alineado al diseño operativo (pestañas, panel lateral, activación/desactivación).
- `Completado` **`catalog-service`:** entidad `taxonomy_attributes`, APIs `v1/admin/taxonomy-attributes`, `AdminApiGuard`, dependencia `jose` para OIDC admin opcional; seed `syncMissingSlugsFromVenues` cuando `SEED_ON_BOOT=true`.
- `Completado` BFF **`/api/admin/taxonomy-attributes`** y contrato en `openapi/catalog.yaml`; estado US-5.2 en `EPICS_USER_STORIES_STATUS.md`.

### Avance de iteración (Sprint UI — cierre ciclo)

- `Completado` **`/admin/duplicados`**: lista de pares (`duplicate-suspects`), búsqueda, enlaces a paneles admin y fichas públicas, «marcar revisado» en `localStorage`.
- `Completado` **`/admin/moderacion-media`**: pestañas reportes de usuario (`venue_reports` con estado `pending|reviewed|dismissed`) y revisión visual de fotos por centro; BFF `PATCH /api/admin/venue-reports/[id]`.
- `Completado` **`catalog-service`**: `GET v1/meta/taxonomy-attributes` (modalidades/amenidades activas para discovery); `GET/PATCH v1/admin/venue-reports`; `GET v1/admin/meta/duplicate-suspects` y `media-review` (admin guard).
- `Completado` **`/partner/planes`** y **`/partner/fotos`**: rutas dedicadas con redirect al panel por centro; sección **`fotos`** en menú lateral del panel.
- `Completado` **`/admin/venues`**: alias a catálogo admin.
- `Completado` **`/buscar`**: chips de modalidad desde taxonomía activa en catalog (fallback local si el servicio no responde).
- `Completado` **`/gyms/[slug]`**: tabs desktop, descripción en resumen mobile, guardar/compartir ya operativos.

### Avance — Rebrand Fase 1 (QueGym)

Plan completo y fases siguientes: **`docs/operations/REBRAND_QUEGYM_PLAN.md`**.

- `Completado` Marca visible **QueGym** en UI pública, partner y admin (`apps/web/src/lib/brand.ts`, `QueGymLogo`, `floit-main-header.tsx`, metadata `layout.tsx`, copy transaccional en fichas, leads, privacidad, buscar).
- `Completado` **QueGym Partners** en login, claim, panel, configuración y metadata partner.
- `Completado` **QueGym Admin** en login y sidebar admin.
- `Completado` OpenAPI `info.title` con prefijo QueGym en los cinco YAML.
- `Completado` E2E `partner-claim.spec.ts` (heading «Tu centro en QueGym»).
- `Sin cambio` (intencional Fase 1): tokens CSS `--floit-*`, claves `localStorage` `floit:*`, `@floit/*`, cookies HTTP `floit_*`, `floit_verified`, eventos `floit.*.v1`, OIDC audience `floit-admin`, CSV `floit-leads.csv`.
- `Pendiente` (Fase 2 planificada): tokens `--quegym-*`, migración `localStorage`, favicon dinámico, `applicationName` PWA — ver plan de rebranding.
- `Pendiente` (Fase 3 planificada): paquetes `@quegym/*`, cookies, eventos v2, enum verificación, OIDC — ver plan de rebranding.

### Plan de acciones funcionales `/gyms/[slug]` (siguiente iteración)

Objetivo: llevar la ficha de centro de “alineada visualmente” a “100% funcional + medible” sin romper contratos del MVP.

- **Fase 1 (P0):** CTAs críticas y conversión
  - `Solicitar información` con ancla/foco al formulario.
  - `WhatsApp`, `Llamar`, `Email` con comportamiento real + fallback si falta canal.
  - `Agregar al comparador` y continuidad de flujo.
- **Fase 2 (P1):** utilidades y navegación — `Completado` mayo 2026
  - `Guardar` (favoritos) y `Compartir` (Web Share + copy fallback) en `gym-action-controls.tsx`.
  - Tabs internas por secciones (`Resumen/Servicios/Galería/Planes/Ubicación`) en mobile y desktop (`gym-mobile-section-tabs.tsx`).
- **Fase 3 (P1):** contenido y secciones — `Completado` parcial
  - Descripción real en resumen mobile/desktop; fallback explícito si falta `description`.
  - Mini mapa/ubicación con navegación útil (`gym-location-map.tsx`, enlace a `/buscar`).
- **Fase 4 (P0):** robustez de formularios
  - Validación completa de lead/report, estados claros de error/éxito y contraste legible.
- **Fase 5 (P0):** instrumentación + QA
  - Verificar `venue_view`, `cta_click`, `lead_submit`, `direct_contact_click`, `venue_report`.
  - Validación con `docs/ux/UI_VISUAL_QA_CHECKLIST.md`.

---

## Verificación de alineación (backlog + PRD + planes)

Matriz de trazabilidad detallada: [`docs/archive/ALIGNMENT_SPRINTS_0_4.md`](./archive/ALIGNMENT_SPRINTS_0_4.md).

### Estado de alineación revisado

| Fuente | Estado | Evidencia |
|--------|--------|-----------|
| `docs/product/BACKLOG.md` | Alta parcial | Sprints 0–3 cubren discovery/comparación/leads/seguridad base; Sprint 4 ya cubre claim + perfil + planes + inbox partner base, pendiente cierre fino UX/ops |
| `docs/product/PRD.md` | Alta | Se mantiene foco MVP en discovery + comparación + lead marketplace; se refuerza audit log admin/partner sin desviar alcance transaccional |
| `docs/product/PLAN_PROMPT_ENGINEERING.md` | Alta parcial | Se respetó contrato-first (OpenAPI), slices verticales y hardening; RBAC ownership ya incluye revocación y auditoría filtrable, pendiente cierre outbox/event bus |
| `docs/product/PLAN_MAESTRO.md` | Parcial-alta | Arquitectura por bounded context activa; brecha principal: `partner-service` estaba subdesarrollado y Sprint 4 ya empezó a cerrarla con claim |

### Brechas activas priorizadas

1. **Partner panel lite en maduración**: núcleo funcional listo; resta cierre UX de estados/errores y métricas de respuesta partner.
2. **Outbox/event bus externo**: outbox fase 1 y colas locales activas; falta conexión a broker externo y workers desacoplados.
3. **OIDC-only definitivo**: aún existe fallback legacy/dev para transición; pendiente activación estricta en staging/prod con evidencia.

### Checklist de cierre Sprint 4

- `Completado` Operación resilient de notificaciones y sync (`retry + DLQ + outbox fase 1`) en leads/partner.
- `Completado` RBAC partner por ownership con revocación y auditoría operativa.
- `Completado` Health operacional para decisión de rollout (`/health` con `readiness` y colas) + visibilidad en `/admin/partner-claims`.
- `Completado` Gate técnico local ejecutado (`pnpm sprint4:gate`) con `PASS` en readiness + auth-negative.
- `Completado` Compatibilidad Node 22 para OIDC guards (`jose` ESM) validada en runtime.
- `Pendiente` Ejecutar runbook `docs/operations/oidc-rollout-sprint4.md` en staging con evidencias E2E admin/partner.
- `Pendiente` Completar y adjuntar `docs/operations/STAGING_EVIDENCE_SPRINT4.md` con resultado `GO` para cierre formal de entorno.
- `Pendiente` Activar `ADMIN_AUTH_REQUIRE_OIDC=true` y `PARTNER_AUTH_REQUIRE_OIDC=true` en staging/prod y retirar fallbacks legacy/dev.
- `Pendiente` Conectar outbox partner->catalog a broker externo (NATS/Rabbit/SQS) con worker independiente.

### Evidencia técnica local (pre-staging)

- `Completado` Re-ejecución reciente de gates locales:
  - `pnpm sprint4:gate` -> `FAIL` por precondiciones OIDC strict no satisfechas en entorno local actual.
  - `pnpm sprint5:flow-checklist` -> `FAIL` por `leads SLA endpoint HTTP 401` (auth admin no configurada para script).
  - `pnpm sprint5:kpi-gate` -> `FAIL` por dependencia del SLA (`sla HTTP 401`).
- `Completado` Smoke E2E local partner venue-scoped en verde (web/BFF + backend) bajo fallback dev.
- Nota: estos resultados documentan estado real local; el criterio de cierre sigue siendo evidencia formal en staging.

---

## Operación local

1. `pnpm docker:up` — Postgres.  
2. `docs/env/local.example` → envs de catalog, web, leads.  
3. `pnpm dev:services`  
4. `pnpm dev`  
5. `pnpm smoke:local`  
6. `pnpm verify`  
7. `pnpm test:e2e` (primera vez: `cd apps/web && npx playwright install chromium`)  
8. Admin: preferir OIDC (`ADMIN_OIDC_*`); `ADMIN_API_TOKEN` solo fallback local.
9. Partner panel: configurar `PARTNER_TO_LEADS_INTERNAL_TOKEN` y `LEADS_INTERNAL_API_TOKEN`.
10. Verificar `GET /health` en `partner-service` para revisar estado OIDC y colas (`catalogSync`/`catalogSyncOutbox`) antes de activar modo estricto.

---

## Referencias

| Artefacto | Ruta |
|-----------|------|
| Contratos | [`openapi/README.md`](../openapi/README.md) |
| Entorno | [`docs/env/local.example`](./env/local.example) |
| Agentes | [`AGENTS.md`](../AGENTS.md) |
| Alineación sprints 0–4 | [`docs/archive/ALIGNMENT_SPRINTS_0_4.md`](./archive/ALIGNMENT_SPRINTS_0_4.md) |
| Estado épicas / user stories | [`docs/operations/EPICS_USER_STORIES_STATUS.md`](./operations/EPICS_USER_STORIES_STATUS.md) |
| Próximos pasos priorizados | [`docs/operations/NEXT_STEPS_RECOMMENDED.md`](./operations/NEXT_STEPS_RECOMMENDED.md) |
| Plan migración UI/UX desde Figma | [`docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`](./ux/FIGMA_UI_UX_MIGRATION_PLAN.md) |
| Brief para próximo agente | [`docs/operations/NEXT_AGENT_BRIEF.md`](./operations/NEXT_AGENT_BRIEF.md) |
| Changelog histórico del proyecto | [`docs/operations/CHANGELOG.md`](./CHANGELOG.md) |
| Plan backend fotos partner->catalog | [`docs/ux/PARTNER_GYM_PHOTOS_BACKEND_PLAN.md`](./ux/PARTNER_GYM_PHOTOS_BACKEND_PLAN.md) |
| Checklist QA visual UI | [`docs/ux/UI_VISUAL_QA_CHECKLIST.md`](./ux/UI_VISUAL_QA_CHECKLIST.md) |
| Evidencias staging Sprint 4 | [`docs/operations/STAGING_EVIDENCE_SPRINT4.md`](./operations/STAGING_EVIDENCE_SPRINT4.md) |
| Evidencias staging Sprint 5 | [`docs/operations/STAGING_EVIDENCE_SPRINT5.md`](./operations/STAGING_EVIDENCE_SPRINT5.md) |
| Handover consolidado de proyecto | [`docs/operations/PROJECT_CONTEXT_HANDOVER.md`](./operations/PROJECT_CONTEXT_HANDOVER.md) |
| Lanzamiento producción | [`docs/operations/PRODUCTION_LAUNCH_PLAN.md`](./operations/PRODUCTION_LAUNCH_PLAN.md) |
| Alta cuentas prod/staging | [`docs/operations/PRODUCTION_ACCOUNTS_SETUP.md`](./operations/PRODUCTION_ACCOUNTS_SETUP.md) |
| Env staging/prod (plantilla) | [`docs/env/production.example`](./env/production.example) |

---

## Sprints siguientes planificados

- **Sprint 6 (cierre operativo staging):** OIDC-only real + evidencias Sprint 4/5 + gates de staging con decisión `GO/NO-GO`.
- **Sprint 7 (escala operativa):** outbox `partner->catalog` con broker externo/worker + cierre de brechas parciales de calidad/operación + gate de performance en CI.
- **Sprint 8–10 (UI/UX Figma):** implementación local completada; queda validación visual final en staging.

Detalle de ejecución:

- `docs/operations/NEXT_STEPS_RECOMMENDED.md`
- `docs/product/PLAN_MAESTRO.md`

---

### Actualización operativa (2026-05-21) — bootstrap producción (documentación + código)

| Área | Entrega |
|------|---------|
| Decisiones | D1–D6 en `PRODUCTION_LAUNCH_PLAN.md` §16 (Vercel, Railway, Neon, Auth0, `www.quegym.com`, Postgres stateful) |
| Guía operador | `PRODUCTION_ACCOUNTS_SETUP.md`, `docs/env/production.example` |
| Web deploy | `apps/web/vercel.json` (install/build desde raíz monorepo) |
| Servicios | `DATABASE_URL` → Postgres en `partner`, `leads`, `analytics`; SQLite si no hay URL (dev) |
| Pendiente | Cuentas reales, DNS staging/prod, Dockerfiles/CI deploy (opcional) |

---

### Actualización operativa (2026-05-21) — catálogo Caracas importado

| Área | Entrega |
|------|---------|
| Datos | **95 venues** en Postgres desde CSV (`data/venues-caracas.source.csv`); eliminación explícita de **8 demos** del seed en BD operativa |
| Scripts | `scripts/venues-import/` + comandos `pnpm venues:*` (ver `data/README.md`) |
| API | `POST /v1/internal/venues` con payload enriquecido y upsert por `slug`; `partner-sync` para planes |
| Docs | `docs/operations/VENUES_CATALOG_IMPORT.md`; sincronización de estado en handover, EPICS, CHANGELOG, guías localhost |

---

*Última actualización documental (2026-05-21): **importación catálogo Caracas** (`VENUES_CATALOG_IMPORT.md`, `data/`, `pnpm venues:*`); BD local sin demos seed (95 venues importados). Histórico 2026-05-10: panel admin — **`/admin/configuracion`** (hub auth read-only + docs); **`/admin/partner-claims`**: modal **Ver detalle** (`claim-detail-modal`), lista claims con **`updatedAt`**, y **`#operaciones-y-sync`** rediseñado (`partner-service-health-panel`, `dlq-failures-panel` sync/outbox, `ownership-partner-venue-panel`, `ownership-audit-panel`, `admin-refresh-button`; auditoría hasta 200 eventos). Histórico mismo sprint: **`/admin/leads`** (modal detalle lead), **`/admin/analytics`** (gráficos MVP + detalle técnico), catálogo admin panel compartido con partner. Referencias actualizadas: `WEB_ROUTES_PLATFORM.md`, `LOCALHOST_LINKS_GUIDE.md`, `LOCAL_TEST_CREDENTIALS.md`, `PROJECT_CONTEXT_HANDOVER.md`, `EPICS_USER_STORIES_STATUS.md`, `CHANGELOG.md`, `NEXT_STEPS_RECOMMENDED.md`.*
