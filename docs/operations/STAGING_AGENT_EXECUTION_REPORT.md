# Informe agente — Deployment QueGym — 2026-05-25 (post-Vercel)

## Fase completada hasta

- [x] **1** Catalog + import (95 venues)
- [x] **2** Vercel env + redeploy — **parcial** (UI discovery OK; search Railway mal configurado)
- [ ] **3** Smoke / gates completos
- [ ] **4** Prod

## URLs Railway (Vercel + verificación)

| Servicio | URL | Estado |
|----------|-----|--------|
| catalog | `https://floitcatalog-service-production.up.railway.app` | `/health/ready` → venues **95** |
| search | `https://floitsearch-service-production.up.railway.app` | `/health` OK; `/v1/search` → **500** |

## Staging UI (tras redeploy Vercel)

| Ruta | Resultado |
|------|-----------|
| `/` | 200 OK |
| `/buscar` | 200 OK — listado con centros (fallback a catalog) |
| `/gyms/gym-fitness-caracas` | **200 OK** |
| `/api/compare/search?q=fitness` | 200 pero `items: []` (search 500) |
| `/admin/login`, `/partner/login` | 200 |

## Acción pendiente (Railway, no Vercel)

En **Railway** → servicio **search** → Variables:

```env
CATALOG_SERVICE_URL=https://floitcatalog-service-production.up.railway.app
HOST=0.0.0.0
```

Redeploy search → comprobar:

```bash
curl -sS "https://floitsearch-service-production.up.railway.app/v1/search?limit=3"
```

Debe devolver JSON con `items` (no 500).

## Decisión

**NO-GO** formal (gates no corridos; search API roto). **Staging usable** para buscar y fichas.

### Próximo paso

1. Arreglar `CATALOG_SERVICE_URL` en Railway **search** (arriba).
2. Añadir en Vercel (si falta): `LEADS_SERVICE_URL`, `PARTNER_SERVICE_URL`, `ANALYTICS_SERVICE_URL` cuando existan dominios públicos.
3. `SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform` + gates Sprint 4/5.
