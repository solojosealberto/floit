# QueGym Docs Index

Mapa canonico de documentacion para operacion diaria del monorepo **QueGym** (carpeta de trabajo puede seguir llamándose `FLOIT v.0.2`).

## Estado operativo (fuente unica de verdad)

- `docs/operations/sprints.md`
- `docs/operations/EPICS_USER_STORIES_STATUS.md`
- `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

Cambios recientes de producto (referencia rapida): **rebrand Fase 2 UI + copy (2026-05-27)** — tokens dual-theme, partner/admin shells, copy venezolano, `pnpm copy:verify`; **staging `staging.quegym.com`** — import **95 venues**; `/health` 5/5 + `smoke:platform` OK; login admin Vercel (`7554d6c`); Sprint 4 gate PASS. Inventario: `STAGING_DEPLOYMENT_STATUS.md`, `REBRAND_QUEGYM_PLAN.md`, `QUEGYM_BRAND_COPY_PLAN.md`. Evidencia: `sprints.md`, `PROJECT_CONTEXT_HANDOVER.md`, `EPICS_USER_STORIES_STATUS.md`, `CHANGELOG.md`.

## Producto (documentos rectores)

- `docs/product/PRD.md`
- `docs/product/BACKLOG.md`
- `docs/product/PLAN_MAESTRO.md`
- `docs/product/PLAN_PROMPT_ENGINEERING.md`

## Operacion y runbooks

- `docs/operations/REBRAND_QUEGYM_PLAN.md` — plan y estado Floit → QueGym (**Fase 2 visual + copy completada** 2026-05-27; Fase 3 técnica planificada)
- `docs/operations/PRODUCTION_LAUNCH_PLAN.md` — lanzamiento en **www.quegym.com** (decisiones D1–D6, GO LIVE)
- `docs/operations/PRODUCTION_ACCOUNTS_SETUP.md` — **paso 2:** alta Vercel, Railway, Neon, Auth0, DNS GoDaddy
- `docs/operations/STAGING_DEPLOYMENT_STATUS.md` — **estado staging** (`staging.quegym.com`, inventario proveedores, paso 3)
- `docs/operations/GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md` — **instrucciones para agente GPT** (prompt sistema, fases, informe; arranque recomendado)
- `docs/operations/STAGING_AGENT_EXECUTION_REPORT.md` — último informe de ejecución del plan de deployment staging
- `docs/operations/AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md` — runbook detallado en navegador (Railway, Vercel, Auth0; bloques A→H)
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

- [`docs/ux/QUEGYM_UX_V0_IMPROVEMENT_PLAN.md`](./ux/QUEGYM_UX_V0_IMPROVEMENT_PLAN.md) — **backlog UX confianza/conversión** (auditoría v0 staging; Sprint UX-A/B/C)
- [`docs/ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md`](./ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md) — tokens, toggle, fases UI (incl. Fase 7 copy)
- [`docs/ux/QUEGYM_BRAND_COPY_PLAN.md`](./ux/QUEGYM_BRAND_COPY_PLAN.md) — tono verbal Venezuela, anti-voseo
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
