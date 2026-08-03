# QueGym Docs Index

Mapa canónico de documentación del monorepo **QueGym** (carpeta de trabajo puede seguir llamándose `FLOIT v.0.2`).

## Arranque (humanos y agentes)

1. **[`docs/operations/NEXT_AGENT_BRIEF.md`](./operations/NEXT_AGENT_BRIEF.md)** — **CURRENT TRUTH** (estado + next)
2. [`docs/operations/DOCUMENTATION_GUIDE.md`](./operations/DOCUMENTATION_GUIDE.md) — cómo leer el corpus
3. [`docs/operations/DOC_STATUS_VOCABULARY.md`](./operations/DOC_STATUS_VOCABULARY.md) — términos de estado
4. [`docs/operations/STATUS_CHANGELOG.md`](./operations/STATUS_CHANGELOG.md) — flips fechados

## Estado operativo

| Rol | Documento |
|-----|-----------|
| Estado vivo | `docs/operations/NEXT_AGENT_BRIEF.md` |
| Ledger sprints | `docs/operations/sprints.md` |
| Épicas / US | `docs/operations/EPICS_USER_STORIES_STATUS.md` |
| Contexto handoff | `docs/operations/PROJECT_CONTEXT_HANDOVER.md` |

**Snapshot (2026-08-03):** staging `https://staging.quegym.com` — health **5/5**, **95 venues**, smoke **PASS**; partner admin **500** remedio en código (redeploy Railway pendiente); QA visual **PASS**; E2E lead API **PASS**; KPI PRD **FAIL** (ventana 7d — re-seed + backdate); GO **pendiente**. Detalle: brief.

## Producto (documentos rectores)

- `docs/product/PRD.md`
- `docs/product/BACKLOG.md`
- `docs/product/PLAN_MAESTRO.md`
- `docs/product/PLAN_PROMPT_ENGINEERING.md`

## Operación y runbooks

- `docs/operations/NEXT_AGENT_BRIEF.md` — **empezar aquí**
- `docs/operations/DOCUMENTATION_GUIDE.md` · `DOC_STATUS_VOCABULARY.md` · `STATUS_CHANGELOG.md`
- `docs/operations/STAGING_DEPLOYMENT_STATUS.md` — checklist staging + runbook KPI 17/17
- `docs/operations/STAGING_EVIDENCE_SPRINT5.md` — §0 vigente; resto histórico
- `docs/operations/STAGING_EVIDENCE_SPRINT4.md`
- `docs/operations/STAGING_AGENT_EXECUTION_REPORT.md` — **Superseded** (KPI); contexto mayo 2026
- `docs/operations/PRODUCTION_LAUNCH_PLAN.md` — cutover `www.quegym.com`
- `docs/operations/PRODUCTION_ACCOUNTS_SETUP.md` — paso 2 cuentas (import/smoke ✅)
- `docs/operations/REBRAND_QUEGYM_PLAN.md` — Fase 2 **done**; Fase 3 técnica pendiente
- `docs/operations/GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md` — **Superseded** para prioridad; usar brief + staging status
- `docs/operations/AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md` — **Superseded** post paso 2/3; referencia de paneles
- `docs/env/production.example` — variables (sin secretos)
- `docs/operations/WEB_ROUTES_PLATFORM.md`
- `docs/operations/ADMIN_CONFIGURATION_PAGE_PLAN.md`
- `docs/operations/VENUES_CATALOG_IMPORT.md`
- `docs/operations/CATALOG_DATA_QUALITY_AND_EXPANSION_SCOPE.md` (+ `.pdf`, `assets/catalog-scope/`)
- `data/README.md`
- `docs/operations/LOCALHOST_LINKS_GUIDE.md`
- `docs/operations/LOCAL_TEST_CREDENTIALS.md`
- `docs/operations/DEPLOY_TEST_RUNBOOK.md`
- `docs/operations/oidc-rollout-sprint4.md`
- `docs/operations/NEXT_STEPS_RECOMMENDED.md` — estrategia larga; Priority 0 → brief
- `docs/operations/TEST_MATRIX_SEARCH_PROFILE_COMPARE_LEAD.md`
- `docs/operations/CHANGELOG.md`
- `docs/operations/prompts/release-2-vertical-slice.md`

## UX y Figma

Planes con implementación cerrada: marcar `status: done` en cabecera — no re-ejecutar fases completadas.

- [`docs/ux/QUEGYM_UX_V0_IMPROVEMENT_PLAN.md`](./ux/QUEGYM_UX_V0_IMPROVEMENT_PLAN.md) — Sprint UX-A/B/C (**done** en repo/staging)
- [`docs/ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md`](./ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md)
- [`docs/ux/QUEGYM_BRAND_COPY_PLAN.md`](./ux/QUEGYM_BRAND_COPY_PLAN.md)
- `docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`
- `docs/ux/FIGMA_UI_UX_BACKLOG.md`
- `docs/ux/FIGMA_SCREEN_INVENTORY.md`
- `docs/ux/FIGMA_TAXONOMY_MAPPING.md`
- `docs/ux/UI_VISUAL_QA_CHECKLIST.md` — QA staging **PASS** (2026-05-27)
- `docs/ux/PARTNER_GYM_PHOTOS_BACKEND_PLAN.md`

## Arquitectura y contratos

- `docs/architecture/adr/001-monorepo-and-bounded-contexts.md`
- `openapi/README.md`

## Gobernanza UX-runtime

- `docs/governance/WIREFRAME_RUNTIME_BOUNDARY.md`
- `docs/governance/WIREFRAME_RUNTIME_TRACEABILITY.md`

## Referencia wireframe (no operativa)

- [`docs/archive/wireframe-v0.2/README.md`](./archive/wireframe-v0.2/README.md) — la carpeta fuente **no** está en este clone; diseño vivo en `docs/ux/*` + Figma.

## Archivo histórico

- `docs/archive/README.md`
