# QueGym — contexto consolidado para futuras iteraciones

Documento de continuidad para retomar el proyecto sin pérdida de contexto técnico, funcional y operativo.

## 1) Qué es QueGym (marco de producto)

**QueGym** (rebrand desde Floit, Fase 1 aplicada mayo 2026) es un marketplace fitness en etapa MVP, enfocado en:

- `discovery` (buscar centros por zona/ubicación y filtros),
- `comparación` (evaluación estructurada de opciones),
- `conversión` a intención comercial (`lead`, WhatsApp, llamada, correo),
- operación `partner/admin` mínima viable y medible.

Fuera del núcleo MVP (por ahora): checkout multi-centro completo, wallet propia, reservas universales y pagos complejos.

## 2) Estado funcional actual (resumen)

En términos de cobertura de backlog/PRD:

- Sprints 0–4: base arquitectónica + discovery + comparación + conversión + partner/admin + hardening de operación.
- Sprint 5 (en curso): funnel analytics, dashboard MVP, SLA partner, experimentación CTA multivariante y gates operativos.

### Catálogo de centros (datos reales Caracas)

| Aspecto | Estado |
|---------|--------|
| Fuente de verdad | `catalog-service` → Postgres `venues` |
| Volumen típico (local cargado) | **~95 venues** importados desde CSV operativo |
| Seed demo (`SEED_ON_BOOT`) | 8 fichas hardcodeadas en `seed.service.ts`; **solo se insertan si la tabla está vacía**; en BD ya limpiada **no** vuelven al reiniciar catalog |
| Import masivo | `pnpm venues:normalize` → `pnpm venues:import` (ver `docs/operations/VENUES_CATALOG_IMPORT.md`) |
| Preservación de fuente | Columnas CSV en `record.source` (JSON) + bloque en `description` marcado `venues-import` |
| Calidad conocida | ~52 venues con coords fallback Caracas; revisar geocode en admin; `venueType`/zonas pueden requerir segunda pasada de mapeo |

Los 8 slugs demo históricos (`oxide-chacao`, `arena-baruta`, `zen-hatillo`, `metropolitan-libertador`, `las-mercedes-cross`, `ride-miranda`, `forma-personal`, `balance-pilates`) **no deben usarse** en smoke/QA salvo que se re-sembré BD vacía o se restaure el seed.

Referencia de estado por épica/US:

- `docs/operations/EPICS_USER_STORIES_STATUS.md`

## 3) Arquitectura y bounded contexts

Estructura monorepo (`pnpm`) con:

- `apps/web` (Next.js App Router + BFF en `app/api/*`)
- `services/catalog`
- `services/search`
- `services/leads`
- `services/partner`
- `services/analytics`
- `packages/contracts` y `packages/ui`
- `openapi/*` como contratos HTTP.

Principios aplicados:

- contrato-first (OpenAPI),
- slices verticales (backend + BFF/UI + docs + scripts),
- ownership por contexto,
- hardening incremental (retry, DLQ, outbox fase 1, readiness gates).

## 4) Infra local y operación actual

### Repositorio remoto

- `origin`: `https://github.com/solojosealberto/floit.git`
- rama activa: `main`

### Runtime local

- Docker + Compose + Colima configurados.
- Postgres local para catálogo levantado por `docker compose`.

### Comandos operativos clave

- Preflight de plataforma: `pnpm platform:preflight`
- Levantar DB catálogo: `pnpm docker:up`
- Levantar servicios backend: `pnpm dev:services`
- Levantar web: `pnpm dev:web`
- Bajar DB: `pnpm docker:down`
- Guía rápida de rutas locales (usuario/admin/partner): `docs/operations/LOCALHOST_LINKS_GUIDE.md`

Runbook operativo:

- `docs/operations/DEPLOY_TEST_RUNBOOK.md`

## 5) Testing y validación (estado real)

### Malla implementada (capability buscar -> ficha -> comparar -> lead)

- Fixtures reutilizables:
  - `tests/fixtures/capability-search-profile-compare-lead.ts`
- Unit:
  - `apps/web/src/lib/venue-badges.spec.ts`
  - `apps/web/src/lib/format-upstream-error.spec.ts`
- Integration (Testcontainers):
  - `services/catalog/test/capability-search-profile-compare.integration.spec.ts`
- Contract (OpenAPI):
  - `tests/contracts/openapi-capability.contract.test.ts`
- E2E Playwright:
  - `apps/web/e2e/capability-search-profile-compare-lead.spec.ts`
  - `apps/web/e2e/lead-flow.spec.ts`

Documentación de esta malla:

- `docs/operations/TEST_MATRIX_SEARCH_PROFILE_COMPARE_LEAD.md`

### Comandos de validación

- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:contract`
- `pnpm test:e2e`
- `pnpm test:capability` (pipeline completo)

## 6) Seguridad y autenticación

Modelo implementado:

- OIDC/JWT para admin/partner con validación JWKS.
- Modos strict configurables:
  - `ADMIN_AUTH_REQUIRE_OIDC`
  - `PARTNER_AUTH_REQUIRE_OIDC`
- Fallbacks legacy/dev aún presentes para transición controlada.

Estado:

- arquitectura y guards listos para OIDC-only,
- cierre operativo final pendiente en staging/prod (evidencia y retiro de fallback).

Edición de fichas **desde admin** (sin sesión partner): la web expone `/admin/catalogo/[venueSlug]/panel` reutilizando el componente del panel partner; el BFF llama a `partner-service` con `AdminApiGuard` en rutas `v1/admin/catalog/venues/:venueSlug/*`. La identidad efectiva es el primer titular activo del venue o, si no existe, el correo en `ADMIN_CATALOG_DELEGATE_EMAIL` (env del servicio partner). Referencia: `docs/operations/LOCALHOST_LINKS_GUIDE.md`.

Runbook:

- `docs/operations/oidc-rollout-sprint4.md`

### Leads, solicitudes partner y claims (mapa operativo)

- **Conversión pública:** formulario de ficha → BFF `POST /api/leads` → `POST /v1/leads` (`leads-service`); confirmación `/lead/confirmacion`; seguimiento **`/lead/estado/[token]`** vía token público. Consentimiento y anti-spam (throttle, IP, Turnstile opcional) en contrato `openapi/leads.yaml`.
- **Backoffice admin — leads:** **`/admin/leads`** con tabla + **`LeadDetailModal`**; contratos `GET/PATCH /v1/admin/lead/:id` y lista `GET /v1/admin/leads`, export CSV, resumen SLA (`openapi/leads.yaml`); BFF en `apps/web/src/app/api/admin/leads/` y `.../leads/[id]/`.
- **Partner — bandeja de leads:** solo **venue-scoped:** `GET/PATCH .../v1/partner/me/venues/{venueSlug}/leads*`; UI **`/partner/leads`**; BFF `/api/partner/me/venues/{venueSlug}/leads*`; rutas globales `/me/leads` deprecadas (`410`).
- **Solicitud de acceso / alta de centro:** wizard público **`/partner/claim`** (`claim-wizard.tsx`, `claimKind` **reclamo** vs **alta nueva** + `newVenueDraft`); envío **`POST /api/partner/claims`**; correo del formulario = identidad de login en **`/partner/login`** tras aprobación; query **`returnTo=`** para volver a admin/catálogo (`WEB_ROUTES_PLATFORM.md`).
- **Admin — revisión de solicitudes:** **`/admin/partner-claims`** — dashboard cliente **`partner-claims-dashboard.tsx`**: KPIs (total, pendientes, registros nuevos, aprobados, rechazados), búsqueda por texto, filtros por chip, tabla con fechas y estado visual, paginación, **Ver detalle** → modal **`claim-detail-modal.tsx`** (centro/borrador alta nueva, solicitante, evidencia URL/texto, historial con `createdAt`/`updatedAt`, acciones con **`ClaimStatusActions`** y cierre al resolver), **export CSV** del listado filtrado; **`GET /v1/admin/partner/claims`** incluye **`updatedAt`** por ítem. En **`#operaciones-y-sync`**: **`partner-service-health-panel.tsx`** (OIDC + colas catalogSync/outbox + readiness), **`dlq-failures-panel.tsx`** (sync + outbox: búsqueda, selección, reintentos POST BFF, modal detalle fila), **`ownership-partner-venue-panel.tsx`** (filtros, revocación, modal detalle), **`ownership-audit-panel.tsx`** (filtros, fecha, CSV, paginación; hasta **200** eventos por carga); **`admin-refresh-button`** para refrescar datos server-side. Cambio de estado claim: **`POST /api/admin/partner/claims/[id]/status`**; si se aprueba **alta nueva**, `partner-service` llama **`POST /v1/internal/venues`** en catalog (stub) y luego ownership + sync; webhook opcional **`PARTNER_CLAIM_STATUS_WEBHOOK_URL`** (`partner_claim_status_changed`). E2E: `e2e/partner-claim.spec.ts`; CI espera health partner **`4013`** cuando hay servicios.
- **Admin — métricas MVP:** **`/admin/analytics`** (`admin-analytics-dashboard.tsx` + `page.tsx`): KPIs, filtros de ventana y dispositivo; gráficos SVG (leads diarios apilados formulario/WhatsApp, donut por dispositivo, serie líneas ficha vs lead); tablas resumen; panel colapsable **Detalle técnico** con funnel por barras, tablas y gráficos de experimento CTA, donut SLA, decisión A/B y serie diaria; UI pensada para **fondo claro** (textos `neutral-*` explícitos) pese a `prefers-color-scheme: dark` en el SO.

## 7) Observabilidad y gates

Implementado:

- health checks por servicio,
- preflight técnico de plataforma,
- checklist de flujo Sprint 5,
- gate KPI Sprint 5,
- gate readiness/auth negativo Sprint 4.

Scripts:

- `scripts/platform-preflight.mjs`
- `scripts/sprint5-flow-checklist.mjs`
- `scripts/sprint5-kpi-gate.mjs`
- `scripts/sprint4-readiness.mjs`
- `scripts/sprint4-auth-negative.mjs`
- `scripts/sprint5-staging-gate.mjs` — gate encadenado staging (sprint4 + flow + kpi)
- `scripts/obtain-auth0-m2m-token.mjs` — `pnpm auth0:m2m-token`

## 8) Riesgos y deuda abierta (priorizada)

1. **Cierre OIDC-only en entorno real**
   - Ejecutar evidencia formal en staging y retirar fallbacks.
2. **Outbox partner->catalog a broker externo**
   - Actualmente fase 1 local; falta NATS/Rabbit/SQS + worker desacoplado.
3. **Hardening operativo avanzado**
   - Perf budgets formales y estrategia de escalado/observabilidad de producción.
4. **Profundidad de Epic 5**
   - Moderación visual y workflows editoriales aún parciales.

## 9) Fuentes rectoras para iterar

Orden recomendado de consulta para cualquier cambio:

1. `docs/product/PRD.md`
2. `docs/product/BACKLOG.md`
3. `docs/product/PLAN_MAESTRO.md`
4. `docs/product/PLAN_PROMPT_ENGINEERING.md`
5. `docs/operations/sprints.md`
6. `docs/operations/EPICS_USER_STORIES_STATUS.md`

### Fuente unica de verdad operativa (obligatoria)

Para estado vivo de ejecucion/release, usar solo:

- `docs/operations/sprints.md`
- `docs/operations/EPICS_USER_STORIES_STATUS.md`
- `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

PRD y planes maestros son rectores estrategicos, no trackers operativos diarios.

## 10) Checklist de arranque para próximas iteraciones

Antes de implementar nuevos cambios:

- validar alineación con PRD/backlog (qué hipótesis o US se mueve),
- actualizar o crear contrato OpenAPI si aplica,
- definir evidencia de prueba por capa (unit/integration/contract/e2e),
- definir criterio de salida medible (gate/checklist/evidencia),
- actualizar `docs/operations/sprints.md` y este handover al cierre de la iteración.

### Checklist minimo de cierre de iteracion

- actualizar estado en los 3 documentos fuente,
- registrar evidencia de pruebas y gates,
- declarar pendientes/riesgos con estado (`Completado`, `Parcial`, `Pendiente`, `Bloqueado`),
- dejar siguiente accion operativa concreta.

## 11) Protocolo de continuidad (siguiente agente / siguiente día)

### Lectura mínima obligatoria (10-15 min)

1. `docs/operations/NEXT_AGENT_BRIEF.md`
2. `docs/operations/NEXT_STEPS_RECOMMENDED.md`
3. `docs/operations/sprints.md`
4. `docs/operations/EPICS_USER_STORIES_STATUS.md`

### Contexto operativo inmediato

- **Rebrand QueGym (2026-05-27):** **Fase 1** copy/metadata ✅. **Fase 2 visual + copy** ✅ en repo local:
  - Tokens dual-theme `--qg-*`, accent Mint, elevación Apple, partner/admin shells, `localStorage` canónico, favicon, export `quegym-leads.csv`.
  - Copy verbal tuteo venezolano (sin voseo); gate `pnpm copy:verify`.
  - Planes: [`REBRAND_QUEGYM_PLAN.md`](REBRAND_QUEGYM_PLAN.md), [`../ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md`](../ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md), [`../ux/QUEGYM_BRAND_COPY_PLAN.md`](../ux/QUEGYM_BRAND_COPY_PLAN.md).
  - Referencias: [propuesta de marca](https://propuestademarca.netlify.app/) · [UI aplicada](https://quegymconmarcaaplicada.netlify.app/).
  - **Pendiente:** QA visual/copy en **staging** (`UI_VISUAL_QA_CHECKLIST.md`).
- **Completado (2026-05-27):** Sprint **UX-A/B/C** — confianza catálogo/conversión en repo ([`QUEGYM_UX_V0_IMPROVEMENT_PLAN.md`](../ux/QUEGYM_UX_V0_IMPROVEMENT_PLAN.md)):
  - Tarjetas unificadas (`VenueCardGrid`), `/buscar` + ficha + home + nav móvil, Lucide/skeletons.
  - **Comparador:** `CompareActiveBar` en `/buscar` (fix visibilidad móvil y desaparición al hover); `CompareGrid` sticky en `/comparar` (grilla móvil alineada a wireframe v0).
  - **Focus campos:** `.qg-field` (focus en contenedor redondeado) y `.qg-input`; sin borde cuadrado grueso en inputs transparentes (home, buscar, logins).
  - Catálogo JSON re-normalizado: `pnpm venues:audit:ui` → **100% descripción limpia** (95 venues); **import Neon staging OK** (2026-06-14, `{ updated: 95 }`).
- **Completado (2026-06-15):** gates Sprint 5 **PASS**; assets marca consolidados; `QueGymLogo` en flujo público + login admin/partner; galería fotos partner cableada; fix CI.
- **Completado (2026-05-27):** menú móvil (`mobile-nav-drawer.tsx`) — panel opaco (`bg-quegym-page`), portal a `document.body` y `z-[1300]` (evita transparencia por `backdrop-blur` del header).
- **Pendiente:** QA visual/copy en staging (`UI_VISUAL_QA_CHECKLIST.md` §2b, §4, §6b, comparador móvil); E2E manual §2–3; tráfico KPI A/B.
- **Identificadores técnicos legacy** sin cambio (`@floit/*`, cookies, `floit_verified`, eventos) — Fase 3 planificada.
- **Sprint UI (Sprint 11) cerrado** (mayo 2026): páginas P1/P2 del plan en `sprints.md` (`/partner/planes`, `/partner/fotos`, `/admin/venues`, `/admin/duplicados`, `/admin/moderacion-media`), discovery con taxonomías activas y pulido ficha gym (tabs, descripción, guardar/compartir).
- **Staging desplegado (2026-05):** infra en Neon `quegym`, Railway `quegym-api`, Auth0, Vercel `floit-web`, DNS **`https://staging.quegym.com`**. Registro: **`STAGING_DEPLOYMENT_STATUS.md`**, informe **`STAGING_AGENT_EXECUTION_REPORT.md`**.
- **Staging paso 3 (2026-05-27):** auth admin desbloqueado — M2M Auth0 + fix issuer `00fd9f9`; `pnpm sprint5:staging-gate -- --kpi-relaxed` → Sprint 4 + flow-checklist **PASS**; KPI A/B **FAIL** (tráfico). `/admin/leads` operativo en staging. Decisión: **GO técnico condicional**. Evidencia: **`STAGING_EVIDENCE_SPRINT5.md`**, **`STAGING_AGENT_EXECUTION_REPORT.md`**.
- **Staging paso 3 (2026-05-26):** import **95 venues**; discovery OK; `/health` 5/5 + `smoke:platform` OK; Sprint 4 gate PASS; Sprint 5 bloqueado por SLA 401 (resuelto 2026-05-27).
- **Admin login staging:** fix `admin-local-login.ts` (`7554d6c`) + M2M BFF (`ADMIN_OIDC_ACCESS_TOKEN` en Vercel Preview).
- **Prod `www`:** sin cutover DNS.
- Objetivo recomendado de la próxima sesión: **QA visual staging** (`UI_VISUAL_QA_CHECKLIST.md`) + E2E manual §2–3 + tráfico KPI A/B + firma GO/NO-GO.
- **Estado reciente:** `/admin/leads` renovada con la misma línea gráfica que `/admin` (grid + sidebar), filtros cliente y métricas derivadas de `GET /v1/admin/leads` + SLA + catálogo para etiquetas de centro/zona.
- **Estado reciente (2026-05-09):** **`/admin/analytics`** ampliada con gráficos MVP coherentes con diseño (apiladas, donut, líneas; detalle técnico colapsable con funnel/SLA/experimento). **`/admin/partner-claims`** renovada con dashboard (KPIs, búsqueda, chips, tabla, paginación, CSV) y bloques operativos anclados (`#operaciones-y-sync`).
- **Estado reciente (2026-05-10):** UI operativa de **`#operaciones-y-sync`** alineada a diseño (paneles health/DLQ/ownership/auditoría como arriba); modal **Ver detalle** de claims; documentación operativa y guías locales sincronizadas con estos cambios.
- **Admin — configuración:** **`/admin/configuracion`** — vista de contexto operativo (sesión, modo de auth del BFF sin secretos, enlaces a runbooks y rutas internas); sidebar «Configuración» enlaza aquí (ya no duplica el dashboard). Implementación: `apps/web/src/app/admin/configuracion/page.tsx`, `apps/web/src/lib/admin-config-summary.ts`. Referencia: `docs/operations/ADMIN_CONFIGURATION_PAGE_PLAN.md`.
- Si surge solicitud fuera de este alcance, registrar como pendiente y mantener foco en el scope UI del sprint hasta completar P1/P2.

### Regla de handoff al cerrar cada jornada

Siempre dejar actualizado:

- estado real de sprints (`docs/operations/sprints.md`),
- estado de épicas/US (`docs/operations/EPICS_USER_STORIES_STATUS.md`),
- contexto consolidado (`docs/operations/PROJECT_CONTEXT_HANDOVER.md`),
- brief de arranque del próximo agente (`docs/operations/NEXT_AGENT_BRIEF.md`).

## 12) Estado reciente: partner login + workspace por gym

Implementado en esta iteración:

- Login partner web por `email + contraseña` (`grant_type=password`) contra `token_endpoint` OIDC y sesión HttpOnly.
- Selector de centros (`/partner/gyms`) y acceso por `venueSlug`.
- Endpoints partner/BFF por centro para perfil, planes y leads.
- `partner_profiles` evolucionado a `partnerEmail + venueSlug` con fallback/backfill desde `__global__`.
- Endpoint BFF legacy de estado de leads (`/api/partner/me/leads/{id}/status`) deprecado operativamente con `410`; flujo oficial en `/api/partner/me/venues/{venueSlug}/leads/{id}/status`.
- Fixture local reproducible `seed:ownership` en `partner-service` para activar/revocar ownership partner↔venue en QA.
- Panel partner rediseñado y funcional por secciones (`Dashboard`, `Editar perfil`, `Planes y precios`, `Leads recibidos`, `Configuración`) con navegación lateral activa y acciones de leads (`Atender`/`Cerrar`) por `venueSlug`.
- Configuración partner llevada a nivel de pantallas dedicadas con diseño de referencia:
  - `/partner/configuracion` (hub),
  - `/partner/configuracion/mis-centros` (listado real por ownership),
  - `/partner/configuracion/cambiar-correo` (flujo de solicitud),
  - `/partner/configuracion/eliminar-cuenta` (flujo irreversible demo-safe).
- Página `/partner/venues` creada como acceso principal de operación multi-centro partner, con acciones directas por venue hacia secciones del panel y ficha pública; `/partner/gyms` queda como ruta legacy con redirect a `/partner/venues`.
- Nuevos endpoints BFF de cuenta partner para smoke funcional local:
  - `POST /api/partner/me/account/email` -> registra solicitud con estado `pending_verification`.
  - `POST /api/partner/me/account/delete` -> valida confirmación y cierra sesión partner en entorno demo.
- Flujo de edición partner refinado: `venueSlug` se selecciona en `Editar perfil` y `Fotos por centro` usa ese centro activo.
- Login local QA por credenciales habilitable vía env (`PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD`, `PARTNER_LOCAL_LOGIN_EMAIL`, `PARTNER_LOCAL_LOGIN_PASSWORD`) con sesión HttpOnly `dev-email:*` para pruebas sin IdP.
- Login local QA admin por credenciales habilitable vía env (`ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD`, `ADMIN_LOCAL_LOGIN_EMAIL`, `ADMIN_LOCAL_LOGIN_PASSWORD`) con sesión HttpOnly; gate centralizado en `apps/web/src/lib/admin-local-login.ts` (local + staging Vercel, no prod `www`).
- Dashboard home admin implementado en `/admin` y redirección post-login actualizada a esa ruta.
- Robustez de `/admin`: fallback de carga parcial por servicio para evitar fallo global por `fetch failed` cuando un upstream no está disponible.
- Comparador `/comparar` rediseñado al layout de referencia (tabla por secciones + CTAs por columna).
- Persistencia de centros en comparación (máx. 3) compartida entre `/buscar` y `/comparar` con `localStorage`.
- Modal de `+ Añadir centro` en `/comparar` con búsqueda incremental vía `/api/compare/search`, sin perder selección vigente.
- Barra flotante de comparación en `/buscar` con chips removibles (`×`) para gestionar selección sin salir del listado.
- Resiliencia local de discovery: `catalog-service` aplica fallback `DATABASE_URL` en entorno no productivo para evitar buscador vacío por falta de env.
- Header **QueGym** global (`FloitMainHeader` / `floit-main-header.tsx`) unificado en layout del flujo público para navegación transversal entre secciones.
- Eliminación del bloque superior legacy tipo browser (`floit.com.ve` + semáforos) en pantallas públicas.
- `/favoritos` rediseñado al estilo visual de discovery, manteniendo carga real de favoritos guardados.
- Comparación desde favoritos por ficha (botón `Comparar/Comparando`) con modal contextual en la misma página.
- Badge `Guardado` en favoritos convertido en acción de deselección para eliminar inmediatamente elementos de la lista.
- Simplificación funcional de `/gyms/[slug]`: formularios movidos a modales activados desde CTAs superiores, eliminando cajas intermedias duplicadas.
- Ajuste de comportamiento de CTA WhatsApp en `/gyms/[slug]`: redirección directa al número del centro (sin paso por modal).
- `photoUrls` de centros demo distribuidas y persistidas en base de datos (`venues.photoUrls`) para todos los slugs seed.
- Home y `/buscar` actualizados para mostrar imágenes reales desde discovery (sin placeholders estáticos) y endpoint de imágenes demo local.
- Ajuste visual final de miniaturas en discovery/favoritos con proporción uniforme y recorte centrado (`object-center`).
- Comparador actualizado para tabla más responsive en desktop/tablet manteniendo cards móviles.
- Refinamiento de `/buscar` en vista `Mapa` desktop: se elimina sidebar de filtros en ese modo y se compactan controles por ficha para evitar recorte de texto en nombres/metadatos.
- Botón `Filtros` activado en `Mapa` desktop con panel desplegable en barra superior (zona/tipo/precio/modalidad), manteniendo separación de comportamiento vs vista lista.
- Ajuste final visual en listado lateral de mapa desktop: iconos compactos para acciones, estado de favorito activo (estrella blanca/fondo negro) y proporción de layout 30% barra / 70% mapa.
- Inventario Sprint UI: rutas P1/P2 del sprint **implementadas** (ver `WEB_ROUTES_PLATFORM.md`). Fuera de MVP: `/checkout`, `/reservas`. Pendiente producto: fusión automática de duplicados, moderación con cola de assets dedicada (más allá de reportes + fotos en catálogo).
- **Taxonomías (detalle técnico):** persistencia PostgreSQL (`taxonomy_attributes`); `GET/POST/PATCH` en `services/catalog` bajo `AdminApiGuard`; sincronización de slugs desde arrays de venues en seed; proxies `apps/web/src/app/api/admin/taxonomy-attributes/*`; contrato `openapi/catalog.yaml`. Siguiente mejora opcional: que search/filtros y chips consuman solo atributos **activos** desde esta tabla (hoy los venues siguen guardando slugs en arrays como antes).

Validación local ejecutada:

- typecheck verde en `@floit/web` y `@floit/partner-service`,
- smoke de deprecación legacy (`410`), fixture de ownership (`active`/`revoked`/restore `active`) y E2E web/BFF partner venue-scoped en verde documentado en `docs/operations/LOCALHOST_LINKS_GUIDE.md`.
- re-ejecución de gates técnicos local documentada con estado real actual: `sprint4:gate` y gates Sprint 5 fallan por precondiciones de auth/entorno no satisfechas (`OIDC strict`/`SLA 401`), no por regresión funcional partner.
- validación E2E local admin: login por formulario, redirección a `/admin`, acceso a `/admin/leads` y carga de dashboard sin error global.
- validación local comparador: adición/remoção de centros desde `/buscar` y `/comparar`, persistencia cross-page y operación del modal de búsqueda en `/comparar`.
- validación local favoritos: tarjetas alineadas visualmente con discovery, compare modal operativo por ficha y remoción inmediata al desmarcar `Guardado`.
- validación local `/gyms/[slug]`: CTAs superiores operativos (`Solicitar información` modal, `WhatsApp` redirección directa, `Reportar datos incorrectos` modal).
- validación local `/buscar` mapa desktop: layout sin sidebar de filtros y tarjetas de lista con nombre legible sin solapamiento de acciones.
- validación local `/buscar` mapa desktop (iteración final): botón `Filtros` funcional, panel desplegable aplicando query params, tarjetas laterales con iconografía compacta y relación visual 30/70 estable.
- validación persistencia fotos: consulta SQL en Postgres confirma `2` fotos por centro en `venues.photoUrls` (8/8 centros seed).
- validación visual fotos: `home`, `/buscar` y `/gyms/[slug]` renderizan imágenes reales (`/api/demo-images/*`) en lugar de placeholders.
- validación visual cross-view: miniaturas de `/buscar` y `/favoritos` presentan tamaño/encuadre consistente y tabla de `/comparar` se adapta mejor al ancho de viewport.
- smoke local partner configuración en verde:
  - login partner local devuelve `303` y cookie de sesión `floit_partner_access_token`,
  - rutas `/partner/panel?venueSlug=oxide-chacao`, `/partner/configuracion/mis-centros`, `/partner/configuracion/cambiar-correo`, `/partner/configuracion/eliminar-cuenta` responden `200`,
  - `POST /api/partner/me/account/email` responde `200` con `pending_verification`,
  - `POST /api/partner/me/account/delete` responde `400` en confirmación inválida y `200` en confirmación válida.
- smoke local partner venues en verde:
  - `/partner/venues` responde `200` con sesión partner local,
  - `/partner/gyms?venueSlug=...` responde `307` con `location: /partner/venues?venueSlug=...`,
  - login partner (`/partner/auth/login`) redirige a `/partner/venues`.

## 13) Inventario de rutas web partner (`apps/web`) y actualización 2026-05-09

### Páginas (`page.tsx`, App Router)

| Ruta | Rol |
|------|-----|
| `/partner` | Entrada del workspace: redirección a panel si hay centro activo; si no, empty state «Mi cuenta» + CTA a alta de centro. |
| `/partner/login` | Formulario de login partner (QA local / OIDC según env). |
| `/partner/claim` | Asistente público de alta o reclamo de centro (multi-paso). |
| `/partner/venues` | Hub multi-centro: accesos por venue a panel y ficha pública. |
| `/partner/gyms` | Selector legacy; redirige hacia `/partner/venues` conservando query cuando aplica. |
| `/partner/panel` | Panel partner (base); suele combinarse con `?venueSlug=` o rutas bajo `[venueSlug]`. |
| `/partner/panel/[venueSlug]` | Panel contextualizado por centro (dashboard, perfil, planes, leads, fotos, configuración según UI). |
| `/partner/leads` | Bandeja de leads del partner (ownership). |
| `/partner/configuracion` | Hub de configuración de cuenta/centros. |
| `/partner/configuracion/mis-centros` | Listado de centros por ownership. |
| `/partner/configuracion/cambiar-correo` | Solicitud de cambio de correo. |
| `/partner/configuracion/eliminar-cuenta` | Flujo de baja de cuenta (demo-safe). |

Layout común: `apps/web/src/app/partner/layout.tsx`.

### Rutas de handler (no son páginas HTML)

| Ruta | Rol |
|------|-----|
| `POST` `/partner/auth/login` | Intercambio credenciales → sesión HttpOnly (`apps/web/src/app/partner/auth/login/route.ts`). |
| `GET` `/partner/auth/callback` | Callback OIDC partner (`auth/callback/route.ts`). |
| `POST` `/partner/logout` | Cierre de sesión partner (`logout/route.ts`); **solo POST** (formulario o acción explícita), no GET. |

### Cambios funcionales documentados (2026-05-09)

- **`/partner/claim`**: wizard en `claim-wizard.tsx`; paso inicial sin stepper; pasos 2–3 con indicador Tipo/Centro/Contacto; bloque «Ya tienes una cuenta» oculto cuando `getPartnerAuthHeader()` indica sesión; modal `<dialog>` informativo una vez por pestaña; el envío incluye `claimKind` y `newVenueDraft` (alta nueva) además del texto legible en `evidence`; el partner-service persiste `claimKind` / `newVenueDraftJson` y, al **aprobar** un claim `new`, crea un stub en catalog (`POST /v1/internal/venues`) antes de ownership + cola de sync. Copy en paso contacto y confirmación: el correo indicado es el de **acceso** a `/partner/login` tras aprobación.
- **`/partner/panel`** y panel admin **`/admin/catalogo/[venueSlug]/panel`**: `PartnerPanelClient` usa `useSearchParams`; la página partner y `AdminCatalogVenuePanelSection` envuelven el cliente en `<Suspense>`.
- **`/partner/configuracion/cambiar-correo`** y **`/partner/configuracion/eliminar-cuenta`**: componentes cliente que leen query (`venueSlug`) van dentro de `<Suspense>` para cumplir requisito de build App Router.
- **`/partner`**: maquetación empty state alineada a referencia cuando no hay centro para redirigir.

### Actualización UX mismo día (2026-05-09, tarde)

- **`/partner/claim`**: revisión de titulares, metadata (`title`/`description`), jerarquía del paso 1 (tarjeta única para «¿Tu centro ya aparece en QueGym?» con dos opciones paralelas: reclamar ficha vs registrar centro nuevo), cabecera «Tu centro en QueGym», textos de pasos 2–3 y alineación cromática con login Partners (`#0a1430`); stepper: etiqueta del paso 1 «Tu caso» (antes «Tipo»).
- **`/partner/panel`**: en Configuración → **Cuenta** → «Cuenta y acceso», acción **Cerrar sesión** mediante `POST /partner/logout` colocada junto a **Eliminar cuenta**; menú lateral de configuración sin botón duplicado de cierre de sesión junto al ítem «Cuenta»; ítem «Cuenta» homogeneizado visualmente con el resto del menú (sin marco/borde exclusivo).

### Navegación descubrimiento → partner (iteración 2026-05)

- **`FloitMainHeader`** (`apps/web/src/app/floit-main-header.tsx`): CTA **«¿Eres partner?»** → **`/partner/login`** (antes `/partner/claim`).
- **Home** (`apps/web/src/app/page.tsx`): banner «¿Tenés un gimnasio…?» / **«Reclamar mi centro →»** → **`/partner/login`** (acceso al workspace; primera vez / alta sigue disponible en **`/partner/claim`** desde login u otros enlaces).
- **`/partner/panel`** (`?venueSlug=`): barra lateral izquierda, botón **«← Mis centros»** → **`/partner/venues`** con **`?venueSlug=`** cuando hay centro activo, para volver rápido al hub de administración de centros.

Inventario consolidado de rutas web: **`docs/operations/WEB_ROUTES_PLATFORM.md`**.

CI (`/.github/workflows/ci.yml`): el job **e2e-services** espera health de **partner-service** en el puerto **4013** además de catalog/search/leads/analytics, para que Playwright con **`E2E_WITH_SERVICES`** pueda resolver **`POST /api/partner/claims`**.

Contrato backend del claim: `openapi/partner.yaml` → `PartnerClaimCreate` (campos opcionales `claimKind`, `newVenueDraft`; catalog `openapi/catalog.yaml` → `internalCreateVenueStub`). Opcional: **`PARTNER_CLAIM_STATUS_WEBHOOK_URL`** en `partner-service` para notificar sistemas externos cuando un admin aprueba o rechaza (`event: partner_claim_status_changed`). E2E: `apps/web/e2e/partner-claim.spec.ts` (API con `E2E_WITH_SERVICES`).
