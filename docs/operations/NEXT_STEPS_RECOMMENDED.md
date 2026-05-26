# QueGym — próximos pasos recomendados (alineados a planes fuente)

Priorización de siguientes iteraciones basada en:

- `docs/product/PLAN_MAESTRO.md`
- `docs/product/PLAN_PROMPT_ENGINEERING.md`
- `docs/product/PRD.md`
- `docs/product/BACKLOG.md`

## Prioridad 0b — Calidad catálogo importado (2026-05-21)

Tras `pnpm venues:load` (~95 venues en local, demos seed retirados de BD):

1. **Geocodificación:** re-ejecutar `pnpm venues:normalize` (caché en `data/venues-geocode-cache.json`) o integrar API Maps; ~52 venues aún con coords fallback — ver `VENUES_CATALOG_IMPORT.md`.
2. **Taxonomía:** segunda pasada de mapeo `venueType` / `zone` en `scripts/venues-import/lib/mappings.mjs` y reimport idempotente.
3. **Partner QA:** sembrar ownership sobre slugs reales (`LOCAL_TEST_CREDENTIALS.md`), no `oxide-chacao`.
4. **Admin:** revisar `/admin/duplicados` y fichas con nota «coordenadas aproximadas» en descripción.

## Prioridad 0 — Staging operativo → producción `www.quegym.com`

Plan: **`PRODUCTION_LAUNCH_PLAN.md`**. Infra staging: **`STAGING_DEPLOYMENT_STATUS.md`**.

**Hecho (2026-05):** Neon `quegym`, Railway `quegym-api` (5 servicios), Auth0, Vercel `floit-web`, DNS `staging.quegym.com` → https://staging.quegym.com (web 200).

**Hecho (2026-05-26, paso 3 parcial):** import **95 venues** (`pnpm venues:import:staging`); catalog+search Railway OK; Vercel con catalog+search → discovery/comparar OK; URLs de los 5 servicios en `production.example` / `STAGING_DEPLOYMENT_STATUS.md`; fix **`express`** en `partner-service` para crash Railway.

**Ahora (cerrar paso 3):**

1. **Railway:** redeploy **partner** (commit con `express`); revisar logs **leads** y despliegue **analytics** hasta `curl …/health` → 200 en los tres.
2. **Vercel Preview:** `LEADS_SERVICE_URL`, `PARTNER_SERVICE_URL`, `ANALYTICS_SERVICE_URL` (sin `/` final) → redeploy web.
3. **`SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform`** + `sprint4:gate` + Sprint 5 gates.
4. **Evidencias** `STAGING_EVIDENCE_SPRINT4/5` → **GO/NO-GO**.
5. **Cutover prod** (solo tras GO): `www.quegym.com`, import prod, OIDC-only, §14 del plan.

## Prioridad 0b — Rebrand (estado)

- **Fase 1 (marca visible):** `Completado` — ver `docs/operations/REBRAND_QUEGYM_PLAN.md`.
- **Fase 2 (tokens, favicon, migración `localStorage`):** `Pendiente` — PR dedicado; no mezclar con OIDC staging.
- **Fase 3 (identificadores técnicos):** `Pendiente` — coordinar con analytics, DB y despliegue.

## Prioridad 1 — Sprint UI (completado mayo 2026)

### 1.0 Estado

- Páginas P1/P2 del Sprint 11 **entregadas** (ver `sprints.md` § Sprint 11 y `WEB_ROUTES_PLATFORM.md`).
- Siguiente foco recomendado: **Prioridad 2** (OIDC staging, QA visual staging, fases 4–5 ficha gym).

### 1.1 Páginas — inventario actual

- **Partner:** `/partner`, `/partner/configuracion`, `/partner/venues`, `/partner/panel`, `/partner/planes`, `/partner/fotos`, `/partner/claim`.
- **Admin:** `/admin/catalogo`, `/admin/venues` (alias), `/admin/duplicados`, `/admin/moderacion-media`, `/admin/taxonomias`, `/admin/leads`, `/admin/partner-claims`, `/admin/configuracion`.
- **P3 (fuera MVP):** `/checkout`, `/reservas`.

### 1.2 Páginas a pulir visualmente en esta ronda

- **`/admin/leads`:** vista operativa alineada a **catálogo** (misma tarjeta blanca y pestañas en barra gris), métricas, banner de sospechosos, filtros y tabla; canal **Formulario / WhatsApp** según `entryChannel` en `leads-service`; dispositivo desde User-Agent reenviado por el BFF (`x-client-user-agent`). **Ver** abre modal de detalle (`LeadDetailModal`) con operación vía **`GET/PATCH /api/admin/leads/[id]`** (servicio: **`/v1/admin/lead/:id`**: estados, `adminNote`, trazabilidad). Export CSV y SLA siguen en `GET /api/admin/leads/export` y métricas dashboard según env.
- `/buscar` (modo mapa desktop, terminado y validado)
- `/gyms/[slug]` (CTAs/modales, terminado y validado)
- páginas nuevas de partner/admin que se creen en este sprint, con consistencia total de design language.

## Prioridad 2 — Cierre operativo de MVP en staging/prod

### 2.1 Activar OIDC-only y retirar fallback legacy

- **Por qué:** PRD y plan maestro priorizan seguridad/roles robustos en operación real.
- **Acción:**
  - staging: `ADMIN_AUTH_REQUIRE_OIDC=true`, `PARTNER_AUTH_REQUIRE_OIDC=true`
  - validar flujos admin/partner con tokens OIDC reales
  - completar evidencia en `docs/operations/STAGING_EVIDENCE_SPRINT4.md`
  - retirar fallback `x-admin-token` y `x-partner-email` luego de validación.
- **Historias relacionadas:** US-8.4, US-7.x, Epic 4.

### 2.1.a Partner claims y catálogo (operación)

- **Catálogo + tokens:** `CATALOG_SERVICE_URL`, `PARTNER_TO_CATALOG_INTERNAL_TOKEN` / `CATALOG_INTERNAL_API_TOKEN` alineados; tras aprobar claim **alta nueva**, debe existir stub en Postgres antes del sync (ver `PROJECT_CONTEXT_HANDOVER`).
- **Webhook opcional:** `PARTNER_CLAIM_STATUS_WEBHOOK_URL` para correo/Slack al aprobar o rechazar (`partner_claim_status_changed`).
- **Admin:** cola y acciones en **`/admin/partner-claims`**; aprobación/rechazo vía BFF **`/api/admin/partner/claims/[id]/status`** (payload según `openapi/partner.yaml`). Wizard público y **`POST /api/partner/claims`** documentados en `WEB_ROUTES_PLATFORM.md`.
- **E2E:** `e2e/partner-claim.spec.ts`; API requiere `E2E_WITH_SERVICES` y partner en marcha (CI espera health **`4013`**).

### 2.1.a2 Backoffice leads (operación continua)

- **Servicio:** `leads-service` — contratos `openapi/leads.yaml` (`GET /v1/admin/leads`, `GET/PATCH /v1/admin/lead/{id}`, export, SLA).
- **Web:** auth admin (`ADMIN_API_TOKEN` u OIDC) en **web** y llamadas server/BFF; si el modal de detalle falla, verificar `LEADS_SERVICE_URL` y que el lead id provenga del listado actual.

### 2.1.b Cerrar login partner real end-to-end

- **Por qué:** ya existe base de login/sesión partner + workspace por gym; falta endurecimiento final.
- **Acción:**
  - validar login partner `email + contraseña` contra `token_endpoint` OIDC (`grant_type=password`) en staging,
  - asegurar que el cliente IdP partner tenga habilitado `password grant`,
  - retirar dependencia de `PARTNER_OIDC_ACCESS_TOKEN` estático en entorno real,
  - asegurar logout consistente y expiración de sesión.
- **Historias relacionadas:** US-4.2, US-4.4, US-8.4.

### 2.1.c Cerrar validación funcional del panel partner en staging

- **Por qué:** el panel partner ya está habilitado por secciones en local; falta confirmación operativa sin fallback dev.
- **Acción:**
  - validar navegación y acciones de `Dashboard / Editar perfil / Planes y precios / Leads recibidos / Configuración`,
  - validar edición de perfil con selección de `venueSlug` desde sección de perfil,
  - validar que `Leads recibidos` mantenga legibilidad y estados correctos sin artefactos de tema.
- **Historias relacionadas:** US-4.2, US-4.3, US-4.4, US-8.1.

### 2.2 Formalizar gate beta Sprint 5 en staging

- **Por qué:** PRD exige criterio cuantitativo de salida MVP.
- **Acción:**
  - ejecutar `pnpm sprint5:flow-checklist` en staging
  - ejecutar `pnpm sprint5:kpi-gate` con umbrales objetivo
  - registrar decisión GO/NO-GO en `docs/operations/STAGING_EVIDENCE_SPRINT5.md`.
- **Historias relacionadas:** US-6.1, US-6.2, US-6.3.

## Prioridad 3 — Cerrar brechas funcionales parciales

### 2.1 Epic 5 (moderación/operación de catálogo)

- **Por qué:** backlog marca calidad de datos y contenido como pilar de confianza.
- **Acción:**
  - flujo editorial completo para duplicados (merge/resolución operativa),
  - moderación de contenido visual con estados y auditoría.
- **Historias relacionadas:** US-5.4, US-5.5.

### 2.2 US-3.4 / US-6.4 (profundidad de conversión y feedback)

- **Por qué:** PRD prioriza señal de intención y aprendizaje post-contacto.
- **Acción:**
  - agendamiento de prueba/visita con slot real (al menos MVP operativo),
  - cerrar encuesta post-lead con explotación de resultados.
- **Historias relacionadas:** US-3.4, US-6.4.

## Prioridad 4 — Evolución técnica para escala (sin sobre-fragmentar)

### 3.1 Outbox partner->catalog a broker externo

- **Por qué:** plan maestro y plan prompt enfatizan eventos confiables y desacople operativo.
- **Acción:**
  - conectar outbox a NATS/Rabbit/SQS,
  - extraer worker dedicado,
  - observabilidad y reintentos independientes del proceso HTTP.

### 3.2 Performance y confiabilidad como gate formal

- **Por qué:** PRD mobile-first + RNF performance.
- **Acción:**
  - definir budget de performance (LCP/INP/CLS),
  - agregar gate técnico de perf en CI para rutas críticas (`/buscar`, `/gyms/[slug]`),
  - monitoreo continuo de errores frontend/backend.

## Prioridad 5 — Preparar Release 2 sin desviarse del core

- **Por qué:** backlog R2 refuerza conversión y calidad antes de transacción compleja.
- **Acción recomendada por orden:**
  1. ampliar US-6.3 (nuevas variantes de copy CTA y decisión automática),
  2. SEO por zonas y landings indexables adicionales (US-8.3),
  3. mejoras de favoritos/comparación con señales de valor (US-2.3/US-2.4).

## Regla de ejecución para próximas iteraciones (prompt engineering)

Para cada capability nueva:

1. contrato OpenAPI primero,
2. slice vertical completo (servicio + BFF/UI + tests + docs),
3. evidencia de validación ejecutable (script/gate/checklist),
4. actualización obligatoria de:
   - `docs/operations/sprints.md`
   - `docs/operations/EPICS_USER_STORIES_STATUS.md`
   - `docs/operations/PROJECT_CONTEXT_HANDOVER.md`.

---

## Plan de ejecución propuesto

### Sprint 6 (2 semanas) — Cierre operativo MVP en staging

**Objetivo**

- Cerrar formalmente rollout seguro y validación de beta en entorno staging con evidencia trazable.

**Entregables**

- OIDC-only activado en staging (`admin` + `partner`) y fallback legacy retirado en staging.
- Evidencia completa de Sprint 4 y Sprint 5:
  - `docs/operations/STAGING_EVIDENCE_SPRINT4.md`
  - `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
- Gate beta ejecutado con umbrales objetivo de PRD (`QIR`, `search->profile`, `profile->lead`, `SLA`).
- Runbook operativo actualizado con incidentes/mitigaciones reales de staging.

**Historias / foco**

- US-8.4, US-7.x, US-6.1/US-6.2/US-6.3 (cierre en entorno real).

**Criterio de salida**

- `GO/NO-GO` formal documentado.
- `sprint4:gate` en PASS en entorno target.
- `sprint5:flow-checklist` y `sprint5:kpi-gate` en PASS con thresholds de staging (no modo local-smoke).

**Validación mínima**

- Flujos E2E admin/partner con tokens OIDC reales.
- Verificación de rechazo de headers legacy en modo estricto.
- Verificación de panel analytics y SLA en datos reales de staging.

### Sprint 7 (2 semanas) — Escalabilidad operativa + cierre de brechas parciales

**Objetivo**

- Asegurar robustez de operación para siguiente fase de crecimiento sin expandir alcance transaccional.

**Entregables**

- Outbox `partner->catalog` conectado a broker externo (NATS/Rabbit/SQS) con worker desacoplado.
- Observabilidad operativa de colas/eventos (health, retries, DLQ, métricas).
- Cierre de brechas funcionales parciales de mayor impacto:
  - US-5.4/US-5.5 (workflow editorial y moderación),
  - US-3.4 o US-6.4 (según capacidad, priorizando impacto de negocio).
- Gate técnico de performance base para rutas core (`/buscar`, `/gyms/[slug]`).

**Historias / foco**

- Epic 5 parcial, Epic 3 parcial, Epic 6 parcial, enablers del plan maestro.

**Criterio de salida**

- Worker/event bus operando con reintentos y evidencia de resiliencia.
- Flujo editorial de calidad de catálogo operable desde admin.
- Performance gate incorporado a CI y ejecutándose en PR.

**Validación mínima**

- Test de integración de outbox con broker.
- E2E de operación admin para calidad de datos.
- Evidencia de métricas/alertas operativas post-desacople.

## Apéndice UX/UI — migración desde Figma

- Plan operativo archivo-por-archivo: `docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`
- Enfoque recomendado: fundación UI compartida (`packages/ui`) y migración por slices (`buscar`, `ficha+lead`, `comparar`, `admin/partner`).
