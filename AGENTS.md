# QueGym — contexto para agentes (Cursor)

## Producto

**QueGym** — marketplace **discovery + comparación + leads** para centros de fitness en Caracas (MVP). Marca visible en UI: `apps/web/src/lib/brand.ts` (`BRAND_NAME`, `BRAND_PARTNERS`, `BRAND_ADMIN`). **Rebrand:** Fase 1 aplicada; plan y fases siguientes en [`docs/operations/REBRAND_QUEGYM_PLAN.md`](docs/operations/REBRAND_QUEGYM_PLAN.md). Identificadores técnicos legacy `floit_*` / paquetes `@floit/*` se mantienen hasta Fase 3. Fuera del núcleo: checkout multi‑centro, wallet, reservas masivas y pagos complejos (solo pilotos).

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
- **Documentación de estado operativo** (única fuente de verdad): `docs/operations/sprints.md`, `docs/operations/EPICS_USER_STORIES_STATUS.md`, `docs/operations/PROJECT_CONTEXT_HANDOVER.md`.
- **Referencia UX/documental**: `Floit Wireframe v.0.2/` (no se usa como estado de release ni como fuente de verdad operativa).
- **Mapa documental**: `docs/index.md`.

Regla: si cambia estado funcional o de entrega, actualiza los 3 documentos de estado operativo.

## Flujo recomendado

1. PRD / backlog → historia y criterios claros.
2. OpenAPI / schema si hay API o evento nuevo.
3. Implementación en **slice vertical** (UI + contrato + servicio + test mínimo).
4. CI verde antes de merge.

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

Resumen ejecutivo por sprint (0–3 documentados): **[`docs/operations/sprints.md`](docs/operations/sprints.md)**.

**Ripado fino R2:** contratos en [`openapi/README.md`](openapi/README.md), plantilla de prompt en [`docs/operations/prompts/release-2-vertical-slice.md`](docs/operations/prompts/release-2-vertical-slice.md), `pnpm docker:up` → Postgres, `pnpm dev:services`, `pnpm verify` (lint + typecheck + build), `pnpm smoke:local` con servicios en marcha.

**Sprint 3 (parcial):** export CSV admin (`/v1/admin/leads/export.csv`, proxy `GET /api/admin/leads/export`), evento `lead_persisted` hacia analytics, Turnstile opcional en `POST /api/leads`, E2E smoke con **`pnpm test:e2e`** (Playwright; primera vez `cd apps/web && npx playwright install chromium`; incluye `e2e/partner-claim.spec.ts`; API de claim con servicios requiere **`E2E_WITH_SERVICES=1`**).

**Admin web (estado actual):** hub **`/admin/configuracion`** (auth read-only + enlaces operativos); **`/admin/partner-claims`** con modal detalle de claims y bloque **`#operaciones-y-sync`** (health, DLQ, ownership, auditoría). Inventario y enlaces: **`docs/operations/WEB_ROUTES_PLATFORM.md`**, **`docs/operations/LOCALHOST_LINKS_GUIDE.md`**.

## Sprint 1 — Discovery local

1. **Postgres / PostGIS:** `docker compose up -d postgres` (puerto 5432).
2. Variables en `services/catalog` (ver `services/catalog/.env.example` y `docs/env/local.example`): al menos `DATABASE_URL`, `DATABASE_SYNC=true`, `SEED_ON_BOOT=true`. Para **`/v1/admin/taxonomy-attributes`** y la pantalla **`/admin/taxonomias`**, usar el mismo **`ADMIN_API_TOKEN`** (u OIDC admin) que en `apps/web`.
3. Arrancar backend con **`pnpm dev:services`** (catalog, search, leads, analytics en paralelo) o servicios sueltos con **`pnpm --filter @floit/<service> dev`**.
4. Web: **`pnpm dev`** (`SEARCH_SERVICE_URL`, `CATALOG_SERVICE_URL`, `LEADS_SERVICE_URL`, `ANALYTICS_SERVICE_URL` en `apps/web/.env.local` opcional; por defecto localhost 4011 / 4010 / 4012 / 4014).

La página `/buscar` lista + mapa (Leaflet/OSM); los filtros viven en la query string y el search service delega en catalog.

## Producción (`www.quegym.com`)

Decisiones **D1–D6** cerradas: Vercel (web), Railway (APIs), Neon (Postgres), Auth0, canónico `https://www.quegym.com`. **Sin cutover DNS** hasta GO de staging.

| Documento | Uso |
|-----------|-----|
| [`docs/operations/PRODUCTION_LAUNCH_PLAN.md`](docs/operations/PRODUCTION_LAUNCH_PLAN.md) | Arquitectura, gates, GO LIVE |
| [`docs/operations/PRODUCTION_ACCOUNTS_SETUP.md`](docs/operations/PRODUCTION_ACCOUNTS_SETUP.md) | Alta Neon → Railway → Auth0 → Vercel → GoDaddy |
| [`docs/operations/STAGING_DEPLOYMENT_STATUS.md`](docs/operations/STAGING_DEPLOYMENT_STATUS.md) | Estado staging desplegado + paso 3 (import, smoke, GO) |
| [`docs/env/production.example`](docs/env/production.example) | Variables staging/prod (sin secretos) |
| [`apps/web/vercel.json`](apps/web/vercel.json) | Build monorepo en Vercel |

**Código listo para Neon:** `partner`, `leads` y `analytics` usan `DATABASE_URL` (Postgres + SSL) si está definido; si no, SQLite local. `catalog` exige `DATABASE_URL` en prod.

**Pendiente en repo:** Dockerfiles y workflow de deploy automático (opcional); cuentas y secretos los configura el operador en los paneles (no en git).

**Importación masiva de venues (CSV Caracas):** `data/venues-caracas.source.csv` → `pnpm venues:normalize` → `pnpm venues:import` (o `pnpm venues:load`); validación `pnpm venues:validate:live` / `pnpm venues:audit`. Guía: [`docs/operations/VENUES_CATALOG_IMPORT.md`](docs/operations/VENUES_CATALOG_IMPORT.md). Entorno cargado (2026-05): **~95 venues** importados; **8 demos del seed eliminados de BD** — no usar `oxide-chacao` en QA salvo BD vacía + `SEED_ON_BOOT`.
