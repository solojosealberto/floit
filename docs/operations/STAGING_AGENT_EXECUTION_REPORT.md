# Informe agente — Deployment QueGym — 2026-05-26

## Fase completada hasta

- [x] **1** Catalog + import (95 venues)
- [x] **2** Vercel + Railway catalog/search — **OK** (discovery + comparador)
- [ ] **3** Smoke / gates — **parcial** (fixes partner en `main`: `express` + TypeORM Postgres; revalidar health tras deploy)
- [ ] **4** Prod

## Catalog + Search

| Check | Resultado |
|-------|-----------|
| catalog `/health/ready` | `venues: 95` |
| search `/v1/search?limit=3` | OK, items presentes |
| search `/v1/meta/zones` | OK |

## URLs Railway

| Servicio | URL | Estado |
|----------|-----|--------|
| catalog | `https://floitcatalog-service-production.up.railway.app` | OK |
| search | `https://floitsearch-service-production.up.railway.app` | OK |
| leads | `https://floitleads-service-production.up.railway.app` | **502** — Application failed to respond |
| partner | `https://floitpartner-service-production.up.railway.app` | **OK** — `/health` 200, `readiness.recommendedForStrictOidc: true` |
| analytics | `https://floitanalytics-service-production.up.railway.app` | **404** — Application not found |

## Staging UI

| Ruta | Resultado |
|------|-----------|
| `/buscar` | PASS (200) |
| `/gyms/gym-fitness-caracas` | PASS (200) |
| `/api/compare/search?q=fitness` | PASS — devuelve items |
| `/` | PASS |

## Smoke `pnpm smoke:platform`

Con `SMOKE_WEB_BASE=https://staging.quegym.com` + URLs catalog/search:

- catalog, search, discovery, fichas web, compare API: **OK**
- leads, partner, analytics health: **FAIL** (502 / 404 en Railway; ver `STAGING_DEPLOYMENT_STATUS.md`)

## Gates Sprint 4/5

No ejecutados contra staging — requieren `LEADS_HEALTH_URL` y `PARTNER_HEALTH_URL` públicos.

## Decisión

**NO-GO** formal (gates + partner/admin/leads en staging pendientes).  
**GO parcial discovery:** staging usable para buscar, comparar y fichas.

### Próximo paso humano

1. Railway → **leads** y **partner** → Deploy logs; corregir env (ver `PRODUCTION_ACCOUNTS_SETUP.md` § Railway leads/partner) hasta `curl …/health` → 200.
2. Railway → **analytics** → confirmar servicio desplegado + dominio; `DATABASE_URL` Neon `/analytics`.
3. Vercel Preview → `LEADS_SERVICE_URL`, `PARTNER_SERVICE_URL`, `ANALYTICS_SERVICE_URL` (URLs de arriba, sin `/` final) → redeploy.
4. `SMOKE_WEB_BASE=https://staging.quegym.com` + las 5 URLs → `pnpm smoke:platform` → gates Sprint 4/5.
