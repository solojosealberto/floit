# Informe agente — Deployment QueGym — 2026-05-25

Ejecución de [`GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md`](./GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md) desde Cursor (terminal + HTTP). Sin acceso a vault, Railway UI ni Vercel.

---

## Fase completada hasta

- [ ] **1** Catalog + import (health/ready + venues) — **bloqueado** (falta `docs/env/staging.local`)
- [ ] **2** Railway URLs + Vercel env — **parcial** (solo catalog URL confirmada)
- [x] **3** Smoke / gates / evidencias — **ejecutado parcial** (smoke staging web; gates con precondiciones no cumplidas)
- [ ] **4** Prod — omitido (sin GO)

---

## Catalog

| Check | Resultado |
|-------|-----------|
| `GET …/health` | `{"ok":true,"service":"catalog"}` |
| `GET …/health/ready` | `503` — `relation "venues" does not exist` |
| Import HTTP (`change-me-dev-only`) | `401 invalid_internal_token` |
| `pnpm staging:bootstrap` | **No ejecutado** — ausente `docs/env/staging.local` |
| `GET …/v1/venues/gym-fitness-caracas` | `500` (sin tabla/datos) |

---

## URLs Railway (sin secretos)

| Servicio | URL | `/health` |
|----------|-----|-----------|
| catalog | `https://floitcatalog-service-production.up.railway.app` | OK |
| search | *desconocida* (patrones `floitsearch-service-production` → 404 Railway) | — |
| leads | *desconocida* | — |
| partner | *desconocida* | — |
| analytics | *desconocida* | — |

**Acción humana:** en Railway `quegym-api` → cada servicio → **Networking → Generate Domain** → anotar en Vercel y en `docs/env/staging.local` (opcional).

---

## Staging UI

| Prueba | Resultado | Notas |
|--------|-----------|-------|
| `GET /` | **PASS** (200) | `SMOKE_WEB_BASE=https://staging.quegym.com` |
| `GET /buscar` | **PASS** (200) | HTML OK; sin venues en payload (catálogo vacío) |
| `GET /gyms/gym-fitness-caracas` | **FAIL** (404) | Esperado sin import |
| `GET /api/compare/search?q=gym` | **PASS** (200) | `items: []` |
| `/admin/login` | **PASS** (200) | |
| `/partner/login` | **PASS** (200) | |

---

## Gates (salida resumida)

| Gate | Resultado |
|------|-----------|
| `pnpm smoke:platform` (solo `SMOKE_WEB_BASE=staging`) | **FAIL** (7 fallos: APIs locales no levantadas; ficha 404) |
| `pnpm smoke:platform` (solo `CATALOG_SERVICE_URL` Railway) | **FAIL** (4 fallos: search/leads/partner/analytics no URL; discovery 404 en catalog) |
| `pnpm sprint4:gate` | **No ejecutado** (requiere `LEADS_HEALTH_URL` + `PARTNER_HEALTH_URL` públicos) |
| `pnpm sprint5:flow-checklist` | **No ejecutado** |
| `pnpm sprint5:kpi-gate` | **No ejecutado** |

---

## Decisión

**NO-GO** (staging no operativo para discovery/leads/partner).

### Bloqueadores

1. **Schema Neon:** tabla `venues` no existe → `DATABASE_SYNC=true` o `CATALOG_ENSURE_SCHEMA=true` **una vez** en Railway catalog, **o** `pnpm staging:bootstrap` con `DATABASE_URL` + token en `docs/env/staging.local`.
2. **Import:** ~95 venues sin cargar (`pnpm staging:bootstrap` / `pnpm venues:import:staging`).
3. **URLs Railway:** search/leads/partner/analytics sin dominio público documentado; Vercel puede apuntar a placeholders.
4. **Secrets locales:** falta `docs/env/staging.local` (plantilla: `docs/env/staging.local.example`).

### Próximo paso humano (una acción concreta)

Crear `docs/env/staging.local` con `DATABASE_URL` (Neon `catalog`) y `CATALOG_INTERNAL_API_TOKEN` (vault = mismo valor que Railway catalog), luego en la raíz del repo:

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
pnpm staging:bootstrap
```

Alternativa sin repo: Railway → catalog → `DATABASE_SYNC=true` → redeploy → verificar `/health/ready` → `DATABASE_SYNC=false` → redeploy → import con token en máquina local.

---

*Generado al ejecutar GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md. Actualizar tras bootstrap exitoso.*
