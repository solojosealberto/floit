# Floit — documentación de sprints (0 → 4)

Fuente única de verdad para **qué se entregó** y **dónde está en el repo**, alineado al Plan maestro, backlog y PRD. Contratos HTTP: [`openapi/`](../openapi/). ADR monorepo: [`adr/001-monorepo-and-bounded-contexts.md`](./adr/001-monorepo-and-bounded-contexts.md).

> **Nota (macOS case-insensitive):** no uses un segundo archivo `docs/SPRINTS.md`; colisiona con `sprints.md` y lo sobrescribe.

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

OpenAPI (`openapi/README.md`), `pnpm verify`, `pnpm smoke:local`, [`docs/prompts/release-2-vertical-slice.md`](./prompts/release-2-vertical-slice.md).

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
| Admin | `GET /v1/admin/leads` + auth OIDC Bearer (fallback legacy local) | `admin-leads.controller.ts`, `admin-api.guard.ts` |
| Web | `/admin/leads` | `admin/leads/page.tsx` |
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
| Readiness OIDC-only | `partner-service /health` expone recomendación `recommendedForStrictOidc` basada en config OIDC + salud de colas | `services/partner/src/health.controller.ts`, `openapi/partner.yaml`, `docs/oidc-rollout-sprint4.md` |
| Automatización pre-check cierre S4 | Script `pnpm sprint4:readiness` valida health/readiness OIDC en leads+partner para staging | `scripts/sprint4-readiness.mjs`, `package.json`, `docs/oidc-rollout-sprint4.md` |
| Automatización pruebas negativas auth | Script `pnpm sprint4:auth-negative` valida rechazo `401` de headers legacy/dev en strict mode | `scripts/sprint4-auth-negative.mjs`, `package.json`, `docs/oidc-rollout-sprint4.md` |
| Gate técnico único de cierre S4 | `pnpm sprint4:gate` encadena readiness + auth-negative para validación automatizada en staging | `package.json`, `docs/oidc-rollout-sprint4.md`, `docs/STAGING_EVIDENCE_SPRINT4.md` |
| Compatibilidad Node 22 (OIDC guards) | Carga dinámica de `jose` para evitar `ERR_REQUIRE_ESM` en `leads` y `partner` al activar auth OIDC | `services/leads/src/admin-api.guard.ts`, `services/partner/src/admin-api.guard.ts`, `services/partner/src/partner-auth.guard.ts` |
| Runbook de activación | Checklist staging/prod + rollback OIDC-only | `docs/oidc-rollout-sprint4.md` |
| DX servicios | `dev:services` incluye `partner-service` | `package.json` (root) |

### Pendiente (cierre operativo por entorno)

- Ejecutar y adjuntar evidencia formal en staging (`docs/STAGING_EVIDENCE_SPRINT4.md`) con decisión `GO/NO-GO`.
- Activar `PARTNER_AUTH_REQUIRE_OIDC=true` en staging/producción y remover fallback dev tras validación final.
- Activar `ADMIN_AUTH_REQUIRE_OIDC=true` en staging/producción y retirar fallback `x-admin-token`.
- Conectar outbox partner->catalog a broker externo (NATS/Rabbit/SQS) y workers independientes (siguiente iteración de arquitectura operativa).

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
| Operación partner sobre estado de leads | Endpoint partner para marcar lead `contacted/closed` con validación de ownership y puente interno S2S hacia leads | `services/partner/src/partner-claims.controller.ts`, `services/partner/src/partner-claims.service.ts`, `services/leads/src/internal-leads.controller.ts`, `apps/web/src/app/api/partner/me/leads/[id]/status/route.ts`, `apps/web/src/app/partner/leads/page.tsx`, `openapi/partner.yaml` |
| US-6.3 experimentación CTA (inicio) | A/B `cta_lead_entrypoint_v2` en ficha (`membership` vs `trial`) con `experiment_assignment`, métricas por variante en analytics y visualización en dashboard admin | `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx`, `services/analytics/src/events.controller.ts`, `apps/web/src/app/admin/analytics/page.tsx`, `openapi/analytics.yaml` |
| US-6.3 decisión automática A/B | Endpoint dedicado de experimento + criterios de estabilidad/uplift para decisión `GO/NO-GO` en dashboard y gate técnico | `services/analytics/src/events.controller.ts`, `openapi/analytics.yaml`, `apps/web/src/app/admin/analytics/page.tsx`, `scripts/sprint5-kpi-gate.mjs` |
| US-6.3 multivariante CTA | Evolución a `cta_lead_entrypoint_v2` con variante adicional `whatsapp_first` y evaluación automática comparada vs baseline `membership` | `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx`, `services/analytics/src/events.controller.ts`, `apps/web/src/app/admin/analytics/page.tsx`, `scripts/sprint5-kpi-gate.mjs`, `openapi/analytics.yaml` |
| Gate técnico KPI Sprint 5 | `pnpm sprint5:kpi-gate` valida umbrales mínimos de funnel + SLA + tamaño mínimo de muestra A/B por variante | `scripts/sprint5-kpi-gate.mjs`, `package.json` |
| Checklist técnico pre-E2E | `pnpm sprint5:flow-checklist` valida disponibilidad de servicios/endpoints antes de prueba integral | `scripts/sprint5-flow-checklist.mjs`, `package.json`, `docs/STAGING_EVIDENCE_SPRINT5.md` |
| Navegación operativa | Links a analytics desde admin leads/claims | `apps/web/src/app/admin/leads/page.tsx`, `apps/web/src/app/admin/partner-claims/page.tsx` |

### Pendiente (resto Sprint 5)

- Añadir variantes adicionales de experimento (copy corto vs largo) sobre baseline actual multivariante.
- Definir gate beta con umbrales KPI (`QIR`, `search->profile`, `profile->lead`, `SLA`) en staging.
- Ejecutar `pnpm sprint5:kpi-gate` contra analytics en staging y registrar resultado como criterio de entrada a beta.
- Ejecutar prueba integral guiada (`pnpm sprint5:flow-checklist` + checklist manual) y completar `docs/STAGING_EVIDENCE_SPRINT5.md`.

---

## Verificación de alineación (backlog + PRD + planes)

Matriz de trazabilidad detallada: [`docs/ALIGNMENT_SPRINTS_0_4.md`](./ALIGNMENT_SPRINTS_0_4.md).

### Estado de alineación revisado

| Fuente | Estado | Evidencia |
|--------|--------|-----------|
| `Backlog Floit.md` | Alta parcial | Sprints 0–3 cubren discovery/comparación/leads/seguridad base; Sprint 4 ya cubre claim + perfil + planes + inbox partner base, pendiente cierre fino UX/ops |
| `PRD Floit.md` | Alta | Se mantiene foco MVP en discovery + comparación + lead marketplace; se refuerza audit log admin/partner sin desviar alcance transaccional |
| `Plan prompt engineering Floit.md` | Alta parcial | Se respetó contrato-first (OpenAPI), slices verticales y hardening; RBAC ownership ya incluye revocación y auditoría filtrable, pendiente cierre outbox/event bus |
| `Plan maestro desarrollo Floit.md` | Parcial-alta | Arquitectura por bounded context activa; brecha principal: `partner-service` estaba subdesarrollado y Sprint 4 ya empezó a cerrarla con claim |

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
- `Pendiente` Ejecutar runbook `docs/oidc-rollout-sprint4.md` en staging con evidencias E2E admin/partner.
- `Pendiente` Completar y adjuntar `docs/STAGING_EVIDENCE_SPRINT4.md` con resultado `GO` para cierre formal de entorno.
- `Pendiente` Activar `ADMIN_AUTH_REQUIRE_OIDC=true` y `PARTNER_AUTH_REQUIRE_OIDC=true` en staging/prod y retirar fallbacks legacy/dev.
- `Pendiente` Conectar outbox partner->catalog a broker externo (NATS/Rabbit/SQS) con worker independiente.

### Evidencia técnica local (pre-staging)

- `Completado` `pnpm sprint4:gate` ejecutado en local contra `localhost` con `ADMIN_AUTH_REQUIRE_OIDC=true` y `PARTNER_AUTH_REQUIRE_OIDC=true`.
- Resultado readiness: `PASS` (`adminStrictOidc=true`, `partnerStrictOidc=true`, `queuesHealthy=true`, `recommendedForStrictOidc=true`).
- Resultado auth-negative: `PASS` (`x-admin-token` y `x-partner-email` rechazados con `401` en modo estricto).
- Nota: esta ejecución valida gate técnico y compatibilidad runtime; no reemplaza la evidencia formal de staging.

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
| Alineación sprints 0–4 | [`docs/ALIGNMENT_SPRINTS_0_4.md`](./ALIGNMENT_SPRINTS_0_4.md) |
| Estado épicas / user stories | [`docs/EPICS_USER_STORIES_STATUS.md`](./EPICS_USER_STORIES_STATUS.md) |
| Evidencias staging Sprint 4 | [`docs/STAGING_EVIDENCE_SPRINT4.md`](./STAGING_EVIDENCE_SPRINT4.md) |
| Evidencias staging Sprint 5 | [`docs/STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md) |

---

*Última actualización: inicio Sprint 5 con funnel analytics + dashboard admin MVP, manteniendo cierre técnico Sprint 4 y pendientes operativos de rollout en staging/prod.*
