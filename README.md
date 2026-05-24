# QueGym Monorepo

Monorepo del MVP de **QueGym** (marketplace fitness): discovery, comparacion y leads.

## Alcance de este repositorio

- **Runtime productivo**: `apps/web`, `services/*`, `packages/*`, `openapi/`, `contracts/events/`, `scripts/`.
- **Referencia UX/documental**: `Floit Wireframe v.0.2/` (no es fuente de estado de release ni de tracking operativo).

Mapa de documentacion: `docs/index.md`.

Rebrand Floit → QueGym: plan y fases en `docs/operations/REBRAND_QUEGYM_PLAN.md` (Fase 1 marca visible aplicada).

Lanzamiento producción (`www.quegym.com`):

- Plan y decisiones: `docs/operations/PRODUCTION_LAUNCH_PLAN.md`
- Alta de cuentas (paso 2): `docs/operations/PRODUCTION_ACCOUNTS_SETUP.md`
- Variables: `docs/env/production.example` · build Vercel: `apps/web/vercel.json`

## Fuente unica de verdad de estado

El estado operativo vivo se mantiene solo en:

- `docs/operations/sprints.md`
- `docs/operations/EPICS_USER_STORIES_STATUS.md`
- `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

Si una iteracion cambia estado funcional o de marca, actualizar esos tres archivos y, si aplica, `docs/operations/REBRAND_QUEGYM_PLAN.md` en el mismo PR.

## Inicio rapido local

- `pnpm docker:up`
- `pnpm dev:services`
- `pnpm dev:web`

Guia de rutas y smoke local: `docs/operations/LOCALHOST_LINKS_GUIDE.md`.

Catálogo Caracas (CSV → Postgres): `docs/operations/VENUES_CATALOG_IMPORT.md` — `pnpm venues:load` tras `pnpm docker:up` y `pnpm dev:services`.
