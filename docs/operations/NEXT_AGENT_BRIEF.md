# QueGym — brief de continuidad (CURRENT TRUTH)

> **Autoridad:** este archivo es la **única tarjeta de estado vivo** para humanos y agentes.  
> Si otro documento contradice esta página, **gana este brief** (salvo evidencia fechada más nueva en § Status log).  
> Ledger histórico: `sprints.md` · Backlog/US: `EPICS_USER_STORIES_STATUS.md` · Contexto: `PROJECT_CONTEXT_HANDOVER.md`.  
> Vocabulario de estados: [`DOC_STATUS_VOCABULARY.md`](./DOC_STATUS_VOCABULARY.md) · Log de flips: [`STATUS_CHANGELOG.md`](./STATUS_CHANGELOG.md).

**Última reconciliación documental:** 2026-08-04 · **Repo HEAD:** `f688639` · **URL staging:** https://staging.quegym.com  
**No usar:** `https://www.staging.quegym.com` (NXDOMAIN — no existe en DNS).

---

## 0) Tarjeta viva (leer primero)

| Campo | Valor (2026-08-04) |
|-------|---------------------|
| Producto | QueGym MVP — discovery + comparación + leads (Caracas) |
| Repo | `main` @ `f688639` |
| Web staging (Vercel) | `staging.quegym.com` — Production alias; panel/ficha + taxonomías + ubicación |
| APIs (Railway `quegym-api`) | catalog / search / leads / partner / analytics — **health 5/5** |
| Partner admin `/v1/admin/*` | **PASS** — claims/profile/plans/photos **200**; bad token **401** |
| Catálogo | **95 venues** |
| Geo VE | **PASS** — 24 estados / municipios / zonas; cascada panel; `?zone=` legacy; chips featured (Las Mercedes→29, Altamira→26) |
| Taxonomías admin | **PASS** — 36 attrs; DELETE + sync-from-venues live (`955de56`) |
| Smoke platform | **PASS** (2026-08-02) |
| QA visual staging | **PASS** (firma producto/ops 2026-05-27) — no reabrir |
| E2E lead **API** | **PASS** — `POST /api/leads` → visible en admin M2M |
| E2E checklist manual §2–3 | **Parcial / opcional** — no bloquea re-seed KPI |
| Sprint 4 OIDC | **PASS relaxed** |
| KPI Sprint 5 **PRD** (último run) | **FAIL 8 checks** (2026-08-02) — ventana 7d sin tráfico reciente |
| `ANALYTICS_ALLOW_BACKDATE` | **ON** — listo para `pnpm staging:generate-traffic` |
| GO producto/ops | **Pendiente** |
| Prod `www.quegym.com` | **Pendiente** (post-GO) |
| Partner media | `PARTNER_PUBLIC_BASE_URL` + volume `/data/uploads` + `blobBase64` en Neon; `/uploads` sirve disco **o** BD |
| Panel admin catálogo | Perfil (tipo multi + horarios picker), planes CRUD↔ficha, fotos persistentes |

### Próximas 3 acciones (orden estricto)

1. `pnpm staging:generate-traffic` → `pnpm sprint5:staging-gate` → objetivo **PASS PRD 17/17**.
2. Desactivar `ANALYTICS_ALLOW_BACKDATE` tras el gate.
3. Firma GO → cutover según [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md).

### Hecho (no repetir) — sesión panel staging 2026-08-03 → 2026-08-04

- Rebrand Fase 1+2, import 95 venues, smoke 5/5, admin M2M, partner OIDC issuer fix
- **Fotos:** URLs públicas (`88a683a`); persistencia volume + Postgres blob (`330c4aa`); preview local al seleccionar
- **Planes:** CRUD UI/API (`9f6ebbf`); ficha `/gyms/[slug]` usa `catalog.plans` reales no mocks (`7686b4f`)
- **Perfil UI:** tipo multi-select, descripción full-width, horarios por día (`dc4748c`); sync `venueType` a catálogo
- Panel hydrate desde catálogo (modalidades/amenidades/horarios/nombre)
- **Taxonomías:** tabla staging estaba vacía (sin `SEED_ON_BOOT`) → seed M2M 19 modalidades + 17 amenidades; código añade DELETE + `sync-from-venues` + auto-heal
- **Geo VE nacional:** Ciudad=municipio, Zona=barrio/sector; dataset + APIs meta; cascada Estado→Municipio→Zona en panel; backfill + preferencia Caracas AM; fix colisión `Las Mercedes` Guárico vs Baruta (`f688639`)

---

## 1) Orden de lectura (humanos y agentes)

1. **Este brief** (estado + next)
2. [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md) — checklist infra + runbook KPI
3. [`STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md) §0 Estado vigente
4. Trinidad si cambia entrega: `sprints.md` → `EPICS_USER_STORIES_STATUS.md` → `PROJECT_CONTEXT_HANDOVER.md`

**No empezar por:** `NEXT_STEPS_RECOMMENDED.md`, ni informes superseded sin banner.

---

## 2) Política KPI (rolling)

Umbrales PRD ~**7 días** (funnel) / **14 días** (experimento). Re-ejecutar `pnpm sprint5:staging-gate` antes de citar score o GO. Para `stable days` ≥ 7: backdate ON + seed, luego **apagar**.

---

## 3) Ops recurrentes antes de gates

| Paso | Comando / nota |
|------|----------------|
| PATH local | `export PATH="$(pwd)/.cursor-bin:$PATH"` |
| Vault | `docs/env/staging.local` (**gitignored**) |
| Token M2M | `AUTH0_M2M_*` en Vercel (BFF renueva). Fallback: `pnpm auth0:m2m-token` |
| Gate smoke | `pnpm sprint5:staging-gate -- --kpi-relaxed` |
| Gate PRD | `pnpm sprint5:staging-gate` |
| Smoke infra | `SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform` |

---

## 4) Checklist técnico de inicio (local opcional)

- `pnpm --filter @floit/web typecheck` · `pnpm copy:verify`
- `pnpm docker:up` + `pnpm dev:services` + `pnpm dev`
- Rutas: [`LOCALHOST_LINKS_GUIDE.md`](./LOCALHOST_LINKS_GUIDE.md)

---

## 5) Archivos clave (panel admin / partner 2026-08-03)

| Área | Archivos |
|------|----------|
| Panel UI | `apps/web/src/app/partner/partner-panel-client.tsx` |
| Horarios / tipos | `apps/web/src/lib/venue-schedule.ts`, `venue-labels.ts` |
| Ficha planes | `apps/web/src/app/gyms/[slug]/gym-plans-section.tsx`, `page.tsx` |
| Fotos durable | `services/partner/src/partner-uploads.controller.ts`, `partner-venue-photo.entity.ts` |
| Sync planes | `services/catalog/.../venues.service.ts` (`plans` jsonb), `update-partner-sync.dto.ts` |
| Env | `PARTNER_PUBLIC_BASE_URL`, `PARTNER_MEDIA_DIR=/data/uploads` |

---

## 6) Definition of done por iteración

- Contratos alineados (OpenAPI/JSON si aplica)
- Tests verdes de la capability afectada
- Evidencia ejecutable (script/gate/checklist)
- Docs de estado operativo actualizados (brief + status changelog + trinidad si aplica)
