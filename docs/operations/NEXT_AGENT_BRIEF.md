# QueGym — brief de continuidad (CURRENT TRUTH)

> **Autoridad:** este archivo es la **única tarjeta de estado vivo** para humanos y agentes.  
> Si otro documento contradice esta página, **gana este brief** (salvo evidencia fechada más nueva en § Status log).  
> Ledger histórico: `sprints.md` · Backlog/US: `EPICS_USER_STORIES_STATUS.md` · Contexto: `PROJECT_CONTEXT_HANDOVER.md`.  
> Vocabulario de estados: [`DOC_STATUS_VOCABULARY.md`](./DOC_STATUS_VOCABULARY.md) · Log de flips: [`STATUS_CHANGELOG.md`](./STATUS_CHANGELOG.md).

**Última reconciliación documental:** 2026-08-03 · **Repo HEAD:** `300fc35` · **URL staging:** https://staging.quegym.com  
**No usar:** `https://www.staging.quegym.com` (NXDOMAIN — no existe en DNS).

---

## 0) Tarjeta viva (leer primero)

| Campo | Valor (2026-08-03) |
|-------|---------------------|
| Producto | QueGym MVP — discovery + comparación + leads (Caracas) |
| Repo | `main` @ `300fc35` |
| Web staging (Vercel) | `staging.quegym.com` — panel catálogo + taxonomías + ubicación + redes + geo |
| APIs (Railway `quegym-api`) | catalog / search / leads / partner / analytics — **health 5/5** |
| Partner admin `/v1/admin/*` | **PASS** — claims/profile/plans/photos **200**; bad token **401** |
| Catálogo | **95 venues** (backfill geo: `stateCode`/`cityId`/`zoneId` en detalle) |
| Geo VE | **PASS** — 24 estados; Ciudad=municipio; Zona=barrio/sector; cascada panel; legacy `?zone=`; Las Mercedes→29 |
| Taxonomías admin | **PASS** — 36 attrs; DELETE + sync-from-venues + auto-heal (`955de56`) |
| Smoke platform | **PASS** (2026-08-02) |
| QA visual staging | **PASS** (firma producto/ops 2026-05-27) — no reabrir |
| E2E lead **API** | **PASS** — `POST /api/leads` → visible en admin M2M |
| E2E checklist manual §2–3 | **Parcial / opcional** — no bloquea re-seed KPI |
| Sprint 4 OIDC | **PASS relaxed** |
| KPI Sprint 5 **PRD** (último run) | **FAIL 8 checks** (2026-08-02) — ventana 7d sin tráfico reciente |
| `ANALYTICS_ALLOW_BACKDATE` | **ON** — listo para `pnpm staging:generate-traffic` |
| GO producto/ops | **Pendiente** |
| Prod `www.quegym.com` | **Pendiente** (post-GO) |
| Partner media | `PARTNER_PUBLIC_BASE_URL` + volume `/data/uploads` + `blobBase64` en Neon |
| Panel admin catálogo | Perfil + mapa/ubicación + Instagram/web + planes↔ficha + fotos durables |

### Próximas 3 acciones (orden estricto)

1. `pnpm staging:generate-traffic` → `pnpm sprint5:staging-gate` → objetivo **PASS PRD 17/17**.
2. Desactivar `ANALYTICS_ALLOW_BACKDATE` tras el gate.
3. Firma GO → cutover según [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md).

### Hecho (no repetir) — jornada 2026-08-03

- Auth admin staging: issuer OIDC + M2M BFF auto-refresh (`d9373dc`, `49cb52a`); probes partner admin **200**
- Panel hydrate desde catálogo (`8333061` / `3dbd45f`)
- **Fotos:** URL pública (`88a683a`); volume Railway + `blobBase64` Neon (`330c4aa`); preview al seleccionar
- **Planes:** CRUD + DELETE (`9f6ebbf`); ficha usa `catalog.plans` reales (`7686b4f`)
- **Perfil UI:** tipo multi-select, horarios day/time, descripción full-width (`dc4748c`)
- **Ubicación:** editor mapa + lat/lng (`b522d98`)
- **Redes:** `instagramHandle` / `websiteUrl` en panel + catálogo (`fc4dec8`)
- **Taxonomías:** vacías en staging → seed 36 attrs; DELETE + `sync-from-venues` + auto-heal (`955de56`)
- **Geo VE nacional** (`9194a49`…`f688639`): dataset estados/municipios/zonas; APIs `/v1/meta/geo/*`; cascada Estado→Municipio→Zona; backfill; preferencia Caracas AM; fix colisión Las Mercedes Guárico vs Baruta; legacy `?zone=` OK

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

## 5) Archivos clave (panel admin / partner / geo 2026-08-03)

| Área | Archivos |
|------|----------|
| Panel UI | `apps/web/src/app/partner/partner-panel-client.tsx` |
| Horarios / tipos | `apps/web/src/lib/venue-schedule.ts`, `venue-labels.ts` |
| Ubicación / mapa | `apps/web/src/components/venue-location-editor.tsx` |
| Geo dataset + API | `data/geo/ve/venezuela-geo.json`, `services/catalog/src/geo/*` |
| Ficha planes | `apps/web/src/app/gyms/[slug]/gym-plans-section.tsx`, `page.tsx` |
| Fotos durable | `services/partner/src/partner-uploads.controller.ts`, `partner-venue-photo.entity.ts` |
| Sync planes / socials | `services/catalog/.../venues.service.ts`, `update-partner-sync.dto.ts` |
| Env | `PARTNER_PUBLIC_BASE_URL`, `PARTNER_MEDIA_DIR=/data/uploads` |

---

## 6) Definition of done por iteración

- Contratos alineados (OpenAPI/JSON si aplica)
- Tests verdes de la capability afectada
- Evidencia ejecutable (script/gate/checklist)
- Docs de estado operativo actualizados (brief + status changelog + trinidad si aplica)
