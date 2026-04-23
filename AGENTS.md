# Floit — contexto para agentes (Cursor)

## Producto

Marketplace **discovery + comparación + leads** para centros de fitness en Caracas (MVP). Fuera del núcleo: checkout multi‑centro, wallet, reservas masivas y pagos complejos (solo pilotos).

## Repo

| Ruta | Rol |
|------|-----|
| `apps/web` | Next.js App Router (UI + BFF inicial) |
| `packages/ui` | Componentes React compartidos |
| `packages/contracts` | Constantes de eventos / contratos TS |
| `services/*` | NestJS por bounded context |
| `openapi/` | Contratos REST OpenAPI 3.1 (`catalog`, `search`, `leads`, `analytics`) |
| `contracts/events/` | JSON Schema de eventos |
| `docs/adr/` | Decisiones de arquitectura |

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

Resumen ejecutivo por sprint (0–3 documentados): **[`docs/sprints.md`](docs/sprints.md)**.

**Ripado fino R2:** contratos en [`openapi/README.md`](openapi/README.md), plantilla de prompt en [`docs/prompts/release-2-vertical-slice.md`](docs/prompts/release-2-vertical-slice.md), `pnpm docker:up` → Postgres, `pnpm dev:services`, `pnpm verify` (lint + typecheck + build), `pnpm smoke:local` con servicios en marcha.

**Sprint 3 (parcial):** export CSV admin (`/v1/admin/leads/export.csv`, proxy `GET /api/admin/leads/export`), evento `lead_persisted` hacia analytics, Turnstile opcional en `POST /api/leads`, E2E smoke con **`pnpm test:e2e`** (Playwright; primera vez `cd apps/web && npx playwright install chromium`).

## Sprint 1 — Discovery local

1. **Postgres / PostGIS:** `docker compose up -d postgres` (puerto 5432).
2. Variables en `services/catalog` (ver `services/catalog/.env.example` y `docs/env/local.example`): al menos `DATABASE_URL`, `DATABASE_SYNC=true`, `SEED_ON_BOOT=true`.
3. Arrancar backend con **`pnpm dev:services`** (catalog, search, leads, analytics en paralelo) o servicios sueltos con **`pnpm --filter @floit/<service> dev`**.
4. Web: **`pnpm dev`** (`SEARCH_SERVICE_URL`, `CATALOG_SERVICE_URL`, `LEADS_SERVICE_URL`, `ANALYTICS_SERVICE_URL` en `apps/web/.env.local` opcional; por defecto localhost 4011 / 4010 / 4012 / 4014).

La página `/buscar` lista + mapa (Leaflet/OSM); los filtros viven en la query string y el search service delega en catalog.
