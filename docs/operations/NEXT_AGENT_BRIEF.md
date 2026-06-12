# QueGym — brief de continuidad para próximo agente

Documento corto para retomar trabajo sin releer todo el historial.

## 1) Estado actual en una frase

Staging **GO técnico condicional**: 5/5 servicios OK, Sprint 4 + `sprint5:flow-checklist` PASS (M2M Auth0 + fix issuer `00fd9f9`), `/admin/leads` operativo. Pendiente: tráfico A/B para KPI gate, E2E manual §2–3, firma producto/ops.

## 2) Prioridad de arranque (orden estricto)

1. `docs/operations/PROJECT_CONTEXT_HANDOVER.md`
2. `docs/operations/NEXT_STEPS_RECOMMENDED.md`
3. `docs/operations/sprints.md`
4. `docs/operations/EPICS_USER_STORIES_STATUS.md`
5. `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
6. Despliegue: `STAGING_DEPLOYMENT_STATUS.md` → `STAGING_AGENT_EXECUTION_REPORT.md`

## 3) Objetivo recomendado para la próxima sesión

**Cierre formal beta staging** (Sprint 6 operativo):

- ~~Auth M2M + SLA 401~~ (**hecho** 2026-05-27),
- ~~`pnpm sprint5:flow-checklist` en staging~~ (**PASS**),
- **Generar tráfico CTA** (membership + trial) y re-ejecutar `pnpm sprint5:staging-gate`,
- **E2E manual** — §2–3 de `STAGING_EVIDENCE_SPRINT5.md`,
- **Renovar** `ADMIN_OIDC_ACCESS_TOKEN` en Vercel si expiró (`pnpm auth0:m2m-token`),
- **Firma GO/NO-GO** producto/ops,
- Luego: cutover prod según `PRODUCTION_LAUNCH_PLAN.md`.

Vault local (gitignored): `docs/env/staging.local` — copiar desde `docs/env/staging.local.example`.

Comando gates:

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
pnpm sprint5:staging-gate -- --kpi-relaxed   # smoke
pnpm sprint5:staging-gate                    # umbrales PRD (cuando haya tráfico)
```

## 4) Checklist técnico de inicio

- `pnpm platform:preflight`
- `pnpm docker:up` + `pnpm dev:services` + `pnpm dev:web` (solo si trabajo local)
- Gates staging: `pnpm sprint5:staging-gate` (lee `docs/env/staging.local`)
- Guía local: `docs/operations/LOCALHOST_LINKS_GUIDE.md`

## 5) Definition of done mínima por iteración

- contratos alineados (OpenAPI/JSON si aplica),
- tests verdes de la capability afectada,
- evidencia de validación ejecutable (script/gate/checklist),
- actualización obligatoria:
  - `docs/operations/sprints.md`
  - `docs/operations/EPICS_USER_STORIES_STATUS.md`
  - `docs/operations/PROJECT_CONTEXT_HANDOVER.md`
  - este brief (si cambió la prioridad).
