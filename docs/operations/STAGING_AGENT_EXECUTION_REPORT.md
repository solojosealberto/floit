# Informe agente — Deployment QueGym

## Última ejecución — 2026-05-27

### Fase completada hasta

- [x] **1** Catalog + import (95 venues)
- [x] **2** Vercel + Railway 5/5 — discovery, comparador, admin BFF
- [x] **3** Smoke / gates — **parcial** (preflight PASS; KPI A/B pendiente tráfico)
- [ ] **4** Prod

### Cambios desplegados

| Commit | Descripción |
|--------|-------------|
| `00fd9f9` | Fix Auth0 issuer con/sin trailing slash (`admin-api.guard` en leads, partner, catalog) |
| Scripts | `auth0:m2m-token`, `sprint5:staging-gate`, `load-staging-env.mjs` |

### Auth0 M2M + Vercel

| Check | Resultado |
|-------|-----------|
| Token M2M (`client_credentials`, audience `floit-admin`) | OK — vault `docs/env/staging.local` |
| Railway leads `/v1/admin/leads` con Bearer | **200** (post-deploy `00fd9f9`) |
| Railway leads `/v1/admin/leads/sla-summary` con Bearer | **200** |
| Vercel `ADMIN_OIDC_ACCESS_TOKEN` en Preview | OK |
| `/admin/leads` tras login admin | **200** — panel operativo |

### Gates (`pnpm sprint5:staging-gate -- --kpi-relaxed`)

| Gate | Resultado |
|------|-----------|
| `sprint4:readiness` | **PASS** |
| `sprint4:auth-negative` | **PASS** |
| `sprint5:flow-checklist` | **PASS** (SLA **200**) |
| `sprint5:kpi-gate` | **FAIL** — `ab variants present (membership + trial)` |

Detalle KPI: 21 eventos analytics; `whatsapp_first` presente; faltan variantes `membership` + `trial` en datos de experimento (tráfico insuficiente).

### Decisión 2026-05-27

**GO técnico condicional** — plataforma estable, auth admin resuelto, preflight Sprint 5 en PASS.  
**NO-GO formal beta** — KPI A/B incompleto + E2E manual pendiente + firma producto/ops.

### Próximo paso operativo

1. Renovar token M2M periódicamente (`pnpm auth0:m2m-token` → Vercel Preview).
2. Sesión QA manual: flujo §2–3 de `STAGING_EVIDENCE_SPRINT5.md` + generar leads con variantes CTA.
3. Re-ejecutar `pnpm sprint5:staging-gate` (sin `--kpi-relaxed` cuando haya volumen).
4. Firma GO/NO-GO producto/ops; luego cutover prod según `PRODUCTION_LAUNCH_PLAN.md`.

---

## Ejecución anterior — 2026-05-26

### Fase completada hasta

- [x] **1** Catalog + import (95 venues)
- [x] **2** Vercel + Railway catalog/search — **OK** (discovery + comparador)
- [ ] **3** Smoke / gates — **parcial** (smoke 5/5 OK; SLA 401 en Sprint 5)
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
| leads | `https://floitleads-service-production.up.railway.app` | OK |
| partner | `https://floitpartner-service-production.up.railway.app` | OK |
| analytics | `https://floitanalytics-service-production.up.railway.app` | OK |

## Staging UI

| Ruta | Resultado |
|------|-----------|
| `/buscar` | PASS (200) |
| `/gyms/gym-fitness-caracas` | PASS (200) |
| `/api/compare/search?q=fitness` | PASS |
| `/admin/leads` (post 2026-05-27) | PASS (200, panel operativo) |

## Smoke `pnpm smoke:platform`

Con `SMOKE_WEB_BASE=https://staging.quegym.com` + 5 URLs Railway: **OK** (2026-05-26).

## Gates Sprint 4/5 (2026-05-26 — histórico)

- `pnpm sprint4:gate`: **PASS**
- `pnpm sprint5:flow-checklist`: **FAIL** (SLA 401)
- `pnpm sprint5:kpi-gate`: **FAIL** (SLA 401)

Resuelto en 2026-05-27 con M2M + fix issuer `00fd9f9`.
