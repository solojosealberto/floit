# QueGym — brief de continuidad (CURRENT TRUTH)

> **Autoridad:** este archivo es la **única tarjeta de estado vivo** para humanos y agentes.  
> Si otro documento contradice esta página, **gana este brief** (salvo evidencia fechada más nueva en § Status log).  
> Ledger histórico: `sprints.md` · Backlog/US: `EPICS_USER_STORIES_STATUS.md` · Contexto: `PROJECT_CONTEXT_HANDOVER.md`.  
> Vocabulario de estados: [`DOC_STATUS_VOCABULARY.md`](./DOC_STATUS_VOCABULARY.md) · Log de flips: [`STATUS_CHANGELOG.md`](./STATUS_CHANGELOG.md).

**Última reconciliación documental:** 2026-08-03 · **Repo HEAD:** `aae2f0d`+ · **URL staging:** https://staging.quegym.com  
**No usar:** `https://www.staging.quegym.com` (NXDOMAIN — no existe en DNS).

---

## 0) Tarjeta viva (leer primero)

| Campo | Valor (2026-08-03) |
|-------|---------------------|
| Producto | QueGym MVP — discovery + comparación + leads (Caracas) |
| Repo | `main` @ `aae2f0d`+ |
| Web staging (Vercel) | `staging.quegym.com` — deploy citado `ca4070b`–`ff98be2` (+ commits posteriores en `main`) |
| APIs (Railway `quegym-api`) | catalog / search / leads / partner / analytics — **health 5/5** |
| Partner admin `/v1/admin/*` | **PASS** (2026-08-03) — issuer Auth0 corregido + redeploy; claims/profile/plans/photos **200**; bad token **401** |
| Catálogo | **95 venues** |
| Smoke platform | **PASS** (2026-08-02) |
| QA visual staging | **PASS** (firma producto/ops 2026-05-27) — no reabrir |
| E2E lead **API** | **PASS** — `POST /api/leads` → visible en admin M2M |
| E2E checklist manual §2–3 | **Parcial / opcional** — no bloquea re-seed KPI; útil antes de GO producto |
| Sprint 4 OIDC | **PASS relaxed** (dentro de staging-gate) |
| KPI Sprint 5 **relaxed** | Histórico **PASS** |
| KPI Sprint 5 **PRD** (último run) | **FAIL 8 checks** (2026-08-02) — ventana 7d sin tráfico reciente |
| Pico histórico KPI PRD | **16/17** el 2026-06-17 (solo fallaba `stable days` 1/7) |
| `ANALYTICS_ALLOW_BACKDATE` en Railway | **ON** (2026-08-03) — listo para `pnpm staging:generate-traffic` |
| CI GitHub `build` | **PASS** en `f937abf` (re-chequear tras este push) |
| CI GitHub `e2e-services` | **FAIL** (lead-flow / timing) — no implica staging caído |
| GO producto/ops | **Pendiente** |
| Prod `www.quegym.com` | **Pendiente** (post-GO) |

### Próximas 3 acciones (orden estricto)

1. `pnpm staging:generate-traffic` → `pnpm sprint5:staging-gate` → objetivo **PASS PRD 17/17** (backdate ya **ON** en analytics).
2. Desactivar `ANALYTICS_ALLOW_BACKDATE` tras el gate.
3. Firma GO → cutover según [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md).

### Hecho (no repetir)

- Rebrand Fase 1 + Fase 2 UI/copy (`pnpm copy:verify`)
- Sprint UX-A/B/C, menú móvil opaco, `QueGymLogo` + `/brand/`, `VenueImage` placeholder
- Import 95 venues, smoke 5/5, admin M2M (`00fd9f9`)
- QA visual PASS; E2E lead API PASS
- Script `staging:generate-traffic` + soporte backdate en código (`f937abf`)
- Vercel Production/Preview: AUTH0_M2M_* + ADMIN_OIDC_ISSUER; BFF leads/taxonomy 200
- Partner admin 500: env `ADMIN_OIDC_ISSUER` era audience `floit-admin` (incorrecto) → `https://<tenant>.us.auth0.com`; código `oidc-jose`; catalog OIDC ON; `ADMIN_CATALOG_DELEGATE_EMAIL` set; analytics backdate ON

---

## 1) Orden de lectura (humanos y agentes)

1. **Este brief** (estado + next)
2. [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md) — checklist infra + runbook KPI
3. [`STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md) §0 Estado vigente (no bloques históricos)
4. Trinidad solo si cambias entrega: `sprints.md` → `EPICS_USER_STORIES_STATUS.md` → `PROJECT_CONTEXT_HANDOVER.md`
5. Planes / UX / product **solo** si abres scope nuevo

**No empezar por:** `NEXT_STEPS_RECOMMENDED.md` (estrategia larga; Priority 0 apunta aquí), ni informes superseded sin banner.

---

## 2) Política KPI (rolling)

Los umbrales PRD usan ventanas ~**7 días** (funnel) y **14 días** (experimento). Un **PASS PRD 16/17** de junio **no** sigue válido semanas después sin tráfico.

- Antes de citar un score KPI en docs o GO: **re-ejecutar** `pnpm sprint5:staging-gate` y anotar fecha + resultado en este brief y `STATUS_CHANGELOG.md`.
- Para `stable days` ≥ 7 en un solo día: `ANALYTICS_ALLOW_BACKDATE=true` + seed, luego **apagar** la variable.

---

## 3) Ops recurrentes antes de gates

| Paso | Comando / nota |
|------|----------------|
| PATH local | `export PATH="$(pwd)/.cursor-bin:$PATH"` |
| Vault | `docs/env/staging.local` (desde `.example`) — **gitignored** |
| Token M2M | Preferido: `AUTH0_M2M_*` en Vercel (BFF renueva solo). Fallback: `pnpm auth0:m2m-token` → `ADMIN_OIDC_ACCESS_TOKEN` |
| Gate smoke | `pnpm sprint5:staging-gate -- --kpi-relaxed` |
| Gate PRD | `pnpm sprint5:staging-gate` |
| Smoke infra | URLs Railway + `SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform` |

---

## 4) Checklist técnico de inicio (local opcional)

- `pnpm --filter @floit/web typecheck`
- `pnpm copy:verify`
- `pnpm docker:up` + `pnpm dev:services` + `pnpm dev` / `dev:web`
- Import local: `pnpm venues:import --update` (catalog **4010**)
- Rutas: [`LOCALHOST_LINKS_GUIDE.md`](./LOCALHOST_LINKS_GUIDE.md)

---

## 5) Archivos clave (última iteración UX)

| Área | Archivos |
|------|----------|
| Tarjetas | `venue-card-grid.tsx`, `venue-card.tsx`, `packages/ui/src/venue-image.tsx` |
| Buscar | `buscar/buscar-client.tsx`, `buscar/loading.tsx`, `discovery-filter-link.tsx` |
| Comparador | `compare-active-bar.tsx`, `compare-grid.tsx`, `comparar/comparar-client.tsx` |
| Marca / shell | `quegym-logo.tsx`, `brand-assets.ts`, `mobile-nav-drawer.tsx`, `floit-main-header.tsx` |
| Focus / forms | `globals.css` (`.qg-field`, `.qg-input`), `packages/ui` input/select |
| Catálogo | `scripts/venues-import/`, `data/venues-caracas.normalized.json` |

---

## 6) Definition of done por iteración

- Contratos alineados (OpenAPI/JSON si aplica)
- Tests verdes de la capability afectada
- Evidencia ejecutable (script/gate/checklist)
- Actualizar **este brief** + `STATUS_CHANGELOG.md`
- Si cambió entrega funcional: trinidad (`sprints` + `EPICS` + `handover`) con **los mismos verbos** que el brief
