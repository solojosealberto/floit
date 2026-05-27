# Informe agente — Deployment QueGym — 2026-05-26

## Fase completada hasta

- [x] **1** Catalog + import (95 venues)
- [x] **2** Vercel + Railway catalog/search — **OK** (discovery + comparador)
- [ ] **3** Smoke / gates — **parcial** (smoke 5/5 OK; faltan gates/evidencias Sprint 4/5)
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
| leads | `https://floitleads-service-production.up.railway.app` | **OK** — `/health` 200 |
| partner | `https://floitpartner-service-production.up.railway.app` | **OK** — `/health` 200, `readiness.recommendedForStrictOidc: true` |
| analytics | `https://floitanalytics-service-production.up.railway.app` | **OK** — `/health` 200 |

## Staging UI

| Ruta | Resultado |
|------|-----------|
| `/buscar` | PASS (200) |
| `/gyms/gym-fitness-caracas` | PASS (200) |
| `/api/compare/search?q=fitness` | PASS — devuelve items |
| `/` | PASS |

## Smoke `pnpm smoke:platform`

Con `SMOKE_WEB_BASE=https://staging.quegym.com` + 5 URLs Railway:

- catalog, search, leads, partner, analytics: **OK**
- discovery, fichas web y compare API: **OK**

## Gates Sprint 4/5

- `pnpm sprint4:gate` (con `LEADS_HEALTH_URL`, `PARTNER_HEALTH_URL`, `LEADS_ADMIN_URL`, `PARTNER_ME_URL` de Railway): **PASS**
- `pnpm sprint5:flow-checklist` (URLs staging): **FAIL** por `leads SLA endpoint HTTP 401`
- `pnpm sprint5:kpi-gate` (URLs staging): **FAIL** por `sla HTTP 401`

## Decisión

**NO-GO formal** (Sprint 5 gate bloqueado por auth admin en SLA endpoint).  
**GO técnico de plataforma:** servicios 5/5, smoke completo y Sprint 4 gate en PASS.

### Próximo paso humano

1. Configurar credencial admin para scripts de Sprint 5: `LEADS_SLA_AUTH_BEARER` (M2M Auth0) o `LEADS_SLA_ADMIN_TOKEN`.
2. Re-ejecutar `pnpm sprint5:flow-checklist` y `pnpm sprint5:kpi-gate` con esa credencial.
3. Si ambos PASS, actualizar evidencia Sprint 5 y cambiar decisión formal a GO.
