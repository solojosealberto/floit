# Informe agente — Deployment QueGym — 2026-05-26

## Fase completada hasta

- [x] **1** Catalog + import (95 venues)
- [x] **2** Vercel + Railway catalog/search — **OK** (discovery + comparador)
- [ ] **3** Smoke / gates — **parcial** (smoke web OK; gates requieren leads/partner URLs)
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
| leads | *pendiente* — generar dominio en Railway | 404 con nombre `floitleads-service-production` |
| partner | *pendiente* | 404 |
| analytics | *pendiente* | 404 |

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
- leads, partner, analytics health: **omitidos** (sin URL pública conocida)

## Gates Sprint 4/5

No ejecutados contra staging — requieren `LEADS_HEALTH_URL` y `PARTNER_HEALTH_URL` públicos.

## Decisión

**NO-GO** formal (gates + partner/admin/leads en staging pendientes).  
**GO parcial discovery:** staging usable para buscar, comparar y fichas.

### Próximo paso humano

1. Railway → **leads**, **partner**, **analytics** → Networking → **Generate Domain**.
2. Vercel Preview → `LEADS_SERVICE_URL`, `PARTNER_SERVICE_URL`, `ANALYTICS_SERVICE_URL`.
3. Redeploy web → `pnpm sprint4:gate` y Sprint 5 con URLs staging.
4. Rellenar evidencias Sprint 4/5 → GO/NO-GO final.
