# QueGym — brief de continuidad para próximo agente

Documento corto para retomar trabajo sin releer todo el historial.

## 1) Estado actual en una frase

**Repo / staging:** HEAD `14fb270`+; QA visual **PASS**; E2E lead **PASS**; KPI PRD **16/17** (solo `stable days` 7/7 pendiente). Pendiente: firma GO/NO-GO ops.

## 2) Prioridad de arranque (orden estricto)

1. `docs/operations/PROJECT_CONTEXT_HANDOVER.md`
2. `docs/operations/NEXT_STEPS_RECOMMENDED.md`
3. `docs/operations/sprints.md`
4. `docs/operations/EPICS_USER_STORIES_STATUS.md`
5. `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
6. Despliegue: `STAGING_DEPLOYMENT_STATUS.md` → `STAGING_AGENT_EXECUTION_REPORT.md`

## 3) Objetivo recomendado para la próxima sesión

**Cierre beta staging:**

1. Activar `ANALYTICS_ALLOW_BACKDATE=true` en Railway **analytics** → redeploy → `pnpm staging:generate-traffic` → `pnpm sprint5:staging-gate` (PRD 17/17).
2. **Firma GO/NO-GO** producto/ops → cutover prod (`PRODUCTION_LAUNCH_PLAN.md`).

**Hecho (no repetir):**

- ~~QA visual staging~~ (PASS 2026-05-27)
- ~~E2E lead + admin/leads~~ (PASS)
- ~~`pnpm staging:generate-traffic`~~ (KPI 16/17)
- ~~Fix CI e2e-services~~ (`next dev -p 3050`)

- ~~Rebrand Fase 2 UI + copy~~ (`pnpm copy:verify`)
- ~~Sprint UX-A/B/C~~ — ver `sprints.md` § Rebrand Fase 2 / Sprint UX
- ~~Menú móvil opaco (portal + `bg-quegym-page`)~~ (2026-05-27)
- ~~`QueGymLogo` + assets `/brand/` (3 PNG) + favicon estático~~ (2026-06-15, local)
- ~~Galería fotos partner cableada~~ (`partner-panel-client.tsx`)
- ~~Placeholder `VenueImage` (siglas + paleta `--qg-*`, `onError`)~~ (`ff98be2`)

Vault local (gitignored): `docs/env/staging.local` — copiar desde `docs/env/staging.local.example`.

Comando gates:

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
pnpm sprint5:staging-gate -- --kpi-relaxed   # smoke
pnpm sprint5:staging-gate                    # umbrales PRD (cuando haya tráfico)
```

## 4) Checklist técnico de inicio

- `pnpm --filter @floit/web typecheck`
- `pnpm copy:verify`
- Local (opcional): `pnpm docker:up` + `pnpm dev:services` + `pnpm dev:web`
- Local import: `pnpm venues:import --update` (catalog en **4010**)
- Guía local: `docs/operations/LOCALHOST_LINKS_GUIDE.md`

## 5) Archivos clave UX (última iteración)

| Área | Archivos |
|------|----------|
| Tarjetas | `venue-card-grid.tsx`, `venue-card.tsx`, `packages/ui/src/venue-image.tsx` |
| Buscar | `buscar/buscar-client.tsx`, `buscar/loading.tsx`, `discovery-filter-link.tsx` |
| Comparador | `compare-active-bar.tsx`, `compare-grid.tsx`, `comparar/comparar-client.tsx` |
| Marca / shell | `quegym-logo.tsx`, `brand-assets.ts`, `mobile-nav-drawer.tsx`, `floit-main-header.tsx` |
| Focus / forms | `globals.css` (`.qg-field`, `.qg-input`), `packages/ui/src/input.tsx`, `select.tsx` |
| Catálogo | `scripts/venues-import/`, `data/venues-caracas.normalized.json` |

## 6) Definition of done mínima por iteración

- contratos alineados (OpenAPI/JSON si aplica),
- tests verdes de la capability afectada,
- evidencia de validación ejecutable (script/gate/checklist),
- actualización obligatoria:
  - `docs/operations/sprints.md`
  - `docs/operations/EPICS_USER_STORIES_STATUS.md`
  - `docs/operations/PROJECT_CONTEXT_HANDOVER.md`
  - este brief (si cambió la prioridad).
