# QueGym — brief de continuidad para próximo agente

Documento corto para retomar trabajo sin releer todo el historial.

## 1) Estado actual en una frase

**Repo local / remoto:** HEAD **`ff98be2`** en `main` (sincronizado con `origin`). Incluye cierre beta (`ca4070b`), placeholder `VenueImage` con siglas (`ff98be2`). **Staging:** https://staging.quegym.com OK; gates Sprint 5 **PASS** con `--kpi-relaxed` (revalidado 2026-05-27). KPI PRD strict **FAIL** (conversión). Pendiente: **QA visual** §6b, E2E manual §2–3, firma GO/NO-GO producto/ops.

## 2) Prioridad de arranque (orden estricto)

1. `docs/operations/PROJECT_CONTEXT_HANDOVER.md`
2. `docs/operations/NEXT_STEPS_RECOMMENDED.md`
3. `docs/operations/sprints.md`
4. `docs/operations/EPICS_USER_STORIES_STATUS.md`
5. `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
6. Despliegue: `STAGING_DEPLOYMENT_STATUS.md` → `STAGING_AGENT_EXECUTION_REPORT.md`

## 3) Objetivo recomendado para la próxima sesión

**Cierre formal beta staging (post-deploy `ca4070b`):**

1. **QA visual** — [`docs/ux/UI_VISUAL_QA_CHECKLIST.md`](../ux/UI_VISUAL_QA_CHECKLIST.md) (§6b menú móvil, §4 focus, comparador).
2. **E2E manual** — §2–3 de `STAGING_EVIDENCE_SPRINT5.md` (lead formulario, partner leads, analytics).
3. **Tráfico CTA** A/B → generar leads reales en staging → `pnpm sprint5:staging-gate` (sin `--kpi-relaxed`).
4. **Firma GO/NO-GO** producto/ops → cutover prod según `PRODUCTION_LAUNCH_PLAN.md`.

**Hecho en repo (no repetir):**

- ~~Commit + deploy `ca4070b`~~ (2026-05-27)
- ~~`pnpm verify` + `smoke:platform` staging~~ (PASS)
- ~~`pnpm sprint5:staging-gate -- --kpi-relaxed`~~ (PASS)

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
