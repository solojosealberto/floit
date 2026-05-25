# QueGym Docs Index

Mapa canonico de documentacion para operacion diaria del monorepo **QueGym** (carpeta de trabajo puede seguir llamándose `FLOIT v.0.2`).

## Estado operativo (fuente unica de verdad)

- `docs/operations/sprints.md`
- `docs/operations/EPICS_USER_STORIES_STATUS.md`
- `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

Cambios recientes de producto (referencia rapida): **catálogo Caracas (~95 venues)** — import masivo CSV (`data/venues-caracas.source.csv`, `pnpm venues:load`, guía `docs/operations/VENUES_CATALOG_IMPORT.md`); seed demo de 8 centros **eliminado de BD** (solo catálogo importado en entornos ya cargados); **rebrand Fase 1** — marca visible **QueGym** / **QueGym Partners** (`docs/operations/REBRAND_QUEGYM_PLAN.md`); **hub admin** **`/admin/configuracion`** (sesión, flags auth read-only, enlaces operativos; `admin-config-summary.ts`); taxonomías admin (`openapi/catalog.yaml`); **leads backoffice** (detalle `GET/PATCH /v1/admin/lead/{id}`, BFF `api/admin/leads/[id]`, `openapi/leads.yaml`); **métricas admin** (`/admin/analytics`: KPIs, gráficos apilados/donut/líneas, panel técnico colapsable); **solicitudes partner** (`/admin/partner-claims`: dashboard KPIs/búsqueda/chips/tabla/modal **Ver detalle**/`claim-detail-modal`, CSV; **`#operaciones-y-sync`** con paneles `partner-service-health-panel`, `dlq-failures-panel` ×2, `ownership-partner-venue-panel`, `ownership-audit-panel`; lista claims con **`updatedAt`**; wizard `/partner/claim`, `openapi/partner.yaml`). Evidencia consolidada en `PROJECT_CONTEXT_HANDOVER.md`, `sprints.md`, `EPICS_USER_STORIES_STATUS.md`, `WEB_ROUTES_PLATFORM.md`, `LOCALHOST_LINKS_GUIDE.md` y `CHANGELOG.md`.

## Producto (documentos rectores)

- `docs/product/PRD.md`
- `docs/product/BACKLOG.md`
- `docs/product/PLAN_MAESTRO.md`
- `docs/product/PLAN_PROMPT_ENGINEERING.md`

## Operacion y runbooks

- `docs/operations/REBRAND_QUEGYM_PLAN.md` — plan y estado Floit → QueGym (Fase 1 aplicada; Fases 2–4 planificadas)
- `docs/operations/PRODUCTION_LAUNCH_PLAN.md` — lanzamiento en **www.quegym.com** (decisiones D1–D6, GO LIVE)
- `docs/operations/PRODUCTION_ACCOUNTS_SETUP.md` — **paso 2:** alta Vercel, Railway, Neon, Auth0, DNS GoDaddy
- `docs/operations/STAGING_DEPLOYMENT_STATUS.md` — **estado staging** (`staging.quegym.com`, inventario proveedores, paso 3)
- `docs/operations/AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md` — **runbook para agente en navegador** (ChatGPT Agent Mode: cerrar 502, import, Vercel, GO/NO-GO)
- `docs/env/production.example` — plantilla de variables staging/prod (sin secretos)
- `docs/operations/WEB_ROUTES_PLATFORM.md` — inventario de rutas web (`apps/web`)
- `docs/operations/ADMIN_CONFIGURATION_PAGE_PLAN.md` — diseño y planificación de `/admin/configuracion` (auth admin, runbooks, navegación)
- `docs/operations/VENUES_CATALOG_IMPORT.md` — pipeline CSV → Postgres (`venues:normalize`, `venues:import`, `venues:audit`)
- `data/README.md` — artefactos de importación (fuente, JSON normalizado, caché geocode)
- `docs/operations/LOCALHOST_LINKS_GUIDE.md`
- `docs/operations/LOCAL_TEST_CREDENTIALS.md`
- `docs/operations/DEPLOY_TEST_RUNBOOK.md`
- `docs/operations/oidc-rollout-sprint4.md`
- `docs/operations/STAGING_EVIDENCE_SPRINT4.md`
- `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
- `docs/operations/NEXT_AGENT_BRIEF.md`
- `docs/operations/NEXT_STEPS_RECOMMENDED.md`
- `docs/operations/TEST_MATRIX_SEARCH_PROFILE_COMPARE_LEAD.md`
- `docs/operations/CHANGELOG.md`
- `docs/operations/prompts/release-2-vertical-slice.md`

## UX y Figma

- `docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`
- `docs/ux/FIGMA_UI_UX_BACKLOG.md`
- `docs/ux/FIGMA_SCREEN_INVENTORY.md`
- `docs/ux/FIGMA_TAXONOMY_MAPPING.md`
- `docs/ux/UI_VISUAL_QA_CHECKLIST.md`
- `docs/ux/PARTNER_GYM_PHOTOS_BACKEND_PLAN.md`

## Arquitectura y contratos

- `docs/architecture/adr/001-monorepo-and-bounded-contexts.md`
- `openapi/README.md`

## Gobernanza UX-runtime

- `docs/governance/WIREFRAME_RUNTIME_BOUNDARY.md`
- `docs/governance/WIREFRAME_RUNTIME_TRACEABILITY.md`

## Referencia wireframe (no operativa)

- `docs/archive/wireframe-v0.2/source/`

Este arbol se conserva como referencia de diseno. No se usa para tracking de release ni estado operativo.

## Archivo historico

- `docs/archive/README.md`
