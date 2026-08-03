# QueGym — contexto para agentes (Cursor)

## Arranque (obligatorio)

1. Leer **[`docs/operations/NEXT_AGENT_BRIEF.md`](docs/operations/NEXT_AGENT_BRIEF.md)** — única **CURRENT TRUTH**.
2. Vocabulario: [`docs/operations/DOC_STATUS_VOCABULARY.md`](docs/operations/DOC_STATUS_VOCABULARY.md).
3. Mapa docs: [`docs/operations/DOCUMENTATION_GUIDE.md`](docs/operations/DOCUMENTATION_GUIDE.md).
4. Si el trabajo es deploy/KPI: [`docs/operations/STAGING_DEPLOYMENT_STATUS.md`](docs/operations/STAGING_DEPLOYMENT_STATUS.md).

## Producto

**QueGym** — marketplace **discovery + comparación + leads** para centros de fitness en Caracas (MVP). Marca visible en UI: `apps/web/src/lib/brand.ts` (`BRAND_NAME`, `BRAND_PARTNERS`, `BRAND_ADMIN`, copy canónico `BRAND_HERO_*`).

**Rebrand:** Fase 1 + **Fase 2 visual/copy completadas** (repo + staging); QA visual staging **PASS** (2026-05-27). Fase 3 (identificadores `@floit/*`) pendiente. Planes: [`REBRAND_QUEGYM_PLAN.md`](docs/operations/REBRAND_QUEGYM_PLAN.md), [`QUEGYM_BRAND_COPY_PLAN.md`](docs/ux/QUEGYM_BRAND_COPY_PLAN.md). Gate copy: `pnpm copy:verify`.

## Repo

| Ruta | Rol |
|------|-----|
| `apps/web` | Next.js App Router (UI + BFF inicial) |
| `packages/ui` | Componentes React compartidos |
| `packages/contracts` | Constantes de eventos / contratos TS |
| `services/*` | NestJS por bounded context |
| `openapi/` | Contratos REST OpenAPI 3.1 (`catalog`, `search`, `leads`, `analytics`) |
| `contracts/events/` | JSON Schema de eventos |
| `docs/architecture/adr/` | Decisiones de arquitectura |

## Frontera operativa (obligatoria)

- **Runtime productivo**: `apps/web`, `services/*`, `packages/*`, `openapi/`, `contracts/events/`, `scripts/`.
- **Estado vivo (prioridad)**: `docs/operations/NEXT_AGENT_BRIEF.md`.
- **Ledger / backlog / contexto** (actualizar si cambia entrega): `docs/operations/sprints.md`, `docs/operations/EPICS_USER_STORIES_STATUS.md`, `docs/operations/PROJECT_CONTEXT_HANDOVER.md` + el brief.
- **Diseño histórico**: no hay carpeta `Floit Wireframe v.0.2/` en el clone; ver [`docs/archive/wireframe-v0.2/README.md`](docs/archive/wireframe-v0.2/README.md). Referencia UX viva: `docs/ux/*` (no es estado de release).
- **Mapa documental**: `docs/index.md`.

Regla: si cambia estado funcional o de entrega, actualiza **brief + `STATUS_CHANGELOG.md`** y la trinidad operativa con los mismos verbos ([vocabulario](docs/operations/DOC_STATUS_VOCABULARY.md)).

## Flujo recomendado

1. PRD / backlog → historia y criterios claros.
2. OpenAPI / schema si hay API o evento nuevo.
3. Implementación en **slice vertical** (UI + contrato + servicio + test mínimo).
4. CI verde antes de merge (hoy: `build` OK; `e2e-services` aún rojo en `main` — ver brief).

## Puertos locales (desarrollo)

| Servicio | Puerto |
|----------|--------|
| catalog | 4010 |
| search | 4011 |
| leads | 4012 |
| partner | 4013 |
| analytics | 4014 |

## Reglas Cursor

Ver `.cursor/rules/*.mdc` — arquitectura, contratos, frontend, backend, testing, DB.

## Sprints — qué se entregó

Resumen: **[`docs/operations/sprints.md`](docs/operations/sprints.md)**. Estado vivo y next: **brief**.

**Ripado fino R2:** contratos en [`openapi/README.md`](openapi/README.md), plantilla en [`docs/operations/prompts/release-2-vertical-slice.md`](docs/operations/prompts/release-2-vertical-slice.md), `pnpm docker:up` → Postgres, `pnpm dev:services`, `pnpm verify`, `pnpm smoke:local`.

**Sprint 3+:** export CSV admin, `lead_persisted`, Turnstile opcional, E2E Playwright (`pnpm test:e2e`; claim con servicios: `E2E_WITH_SERVICES=1`).

**Admin web:** hub `/admin/configuracion`; `/admin/partner-claims` + `#operaciones-y-sync`. Rutas: [`WEB_ROUTES_PLATFORM.md`](docs/operations/WEB_ROUTES_PLATFORM.md), [`LOCALHOST_LINKS_GUIDE.md`](docs/operations/LOCALHOST_LINKS_GUIDE.md).

## Sprint 1 — Discovery local

1. **Postgres / PostGIS:** `docker compose up -d postgres` (5432).
2. Variables en `services/catalog` (ver `.env.example` / `docs/env/local.example`).
3. Backend: `pnpm dev:services`.
4. Web: `pnpm dev` (defaults localhost 4010–4014).

## Staging y producción

| Documento | Uso |
|-----------|-----|
| [`NEXT_AGENT_BRIEF.md`](docs/operations/NEXT_AGENT_BRIEF.md) | **CURRENT TRUTH** |
| [`STAGING_DEPLOYMENT_STATUS.md`](docs/operations/STAGING_DEPLOYMENT_STATUS.md) | Staging `https://staging.quegym.com` — health **5/5**, 95 venues; partner admin OIDC fix en código (redeploy); KPI PRD pendiente re-seed |
| [`PRODUCTION_LAUNCH_PLAN.md`](docs/operations/PRODUCTION_LAUNCH_PLAN.md) | Cutover `www.quegym.com` post-GO |
| [`PRODUCTION_ACCOUNTS_SETUP.md`](docs/operations/PRODUCTION_ACCOUNTS_SETUP.md) | Alta cuentas (paso 2 hecho; import/smoke hechos) |
| [`STAGING_AGENT_EXECUTION_REPORT.md`](docs/operations/STAGING_AGENT_EXECUTION_REPORT.md) | **Superseded** para KPI — contexto histórico |
| [`docs/env/production.example`](docs/env/production.example) | Variables (sin secretos) |
| [`apps/web/vercel.json`](apps/web/vercel.json) | Build monorepo Vercel |

Decisiones **D1–D6** cerradas. **Sin cutover DNS prod** hasta GO staging.

**Import venues:** `pnpm venues:normalize` → `pnpm venues:import` — guía [`VENUES_CATALOG_IMPORT.md`](docs/operations/VENUES_CATALOG_IMPORT.md). Staging: **~95 venues**; no usar demos seed (`oxide-chacao`, etc.) salvo BD vacía + `SEED_ON_BOOT`.
