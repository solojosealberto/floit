# QueGym — brief de continuidad para próximo agente

Documento corto para retomar trabajo sin releer todo el historial.

## 1) Estado actual en una frase

Marca visible **QueGym** (rebrand Fase 1). Core MVP funcional en **local**; en **staging** discovery/comparar **OK** (95 venues, catalog+search+Vercel). Pendiente: **leads/partner/analytics** Railway (`/health` 502/404), redeploy **partner** tras fix `express`, env Vercel para los 3 BFF, smoke/gates Sprint 4/5 y GO/NO-GO. Admin/partner web documentados; OIDC-only + KPI beta siguen bloqueados por upstreams staging.

## 2) Prioridad de arranque (orden estricto)

1. `docs/operations/PROJECT_CONTEXT_HANDOVER.md`
2. `docs/operations/NEXT_STEPS_RECOMMENDED.md`
3. `docs/operations/sprints.md`
4. `docs/operations/EPICS_USER_STORIES_STATUS.md`
5. `docs/operations/oidc-rollout-sprint4.md`
6. Despliegue: `PRODUCTION_LAUNCH_PLAN.md` → `STAGING_DEPLOYMENT_STATUS.md` → **`AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md`** (agente navegador)

## 3) Objetivo recomendado para la próxima sesión

**Staging paso 3 parcial** (`STAGING_DEPLOYMENT_STATUS.md`, `STAGING_AGENT_EXECUTION_REPORT.md`). Prioridad inmediata: **redeploy partner** + arrancar leads/analytics en Railway → `/health` × 5 → Vercel env → gates.

Cerrar Sprint 6 operativo (staging):

- ~~import catálogo Neon~~ (**hecho:** 95 venues, 2026-05-26),
- confirmar `/health` en **leads, partner, analytics** (URLs ya documentadas; partner: dep `express` en `main`),
- añadir `LEADS_*`, `PARTNER_*`, `ANALYTICS_*` en Vercel Preview y redeploy,
- habilitar OIDC estricto admin/partner en entorno real donde aplique,
- ejecutar gates y evidencia:
  - `pnpm sprint4:gate`
  - `pnpm sprint5:flow-checklist`
  - `pnpm sprint5:kpi-gate`
- completar:
  - `docs/operations/STAGING_EVIDENCE_SPRINT4.md`
  - `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
- registrar decisión `GO/NO-GO`.
- validar end-to-end login partner por centro con IdP real y sesión web (sin token estático de entorno),
- ejecutar smoke partner venue-scoped autenticado para `leads/{id}/status` y evidencia de ownership (con/sin acceso).
- asegurar auth admin para `leads SLA` y re-ejecutar `sprint5:flow-checklist` + `sprint5:kpi-gate` sin `401`.

Estado local actual de referencia:

- Smoke E2E web/BFF partner venue-scoped: `PASS` bajo fallback dev.
- Gates técnicos locales: `FAIL` por precondiciones de auth/entorno (`OIDC strict` + `SLA 401`).

## 4) Checklist técnico de inicio

- `pnpm platform:preflight`
- `pnpm docker:up`
- `pnpm dev:services`
- `pnpm dev:web`
- validar `/health` de servicios críticos
- si se toca UI core: correr `pnpm test:e2e` y `pnpm test:capability`
- usar guía de enlaces locales para pruebas manuales: `docs/operations/LOCALHOST_LINKS_GUIDE.md`
- si falta ownership de QA: usar `npx pnpm --filter @floit/partner-service seed:ownership -- --email <email> --venue <slug> --status active`

## 5) Cambios de UI/UX (Figma) ya planificados

Existe plan operativo archivo-por-archivo:

- `docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`

Regla: no empezar implementación visual sin resolver taxonomía Figma→QueGym (runtime) por escrito (`docs/ux/FIGMA_TAXONOMY_MAPPING.md`).

## 5.1) Rebrand Floit → QueGym

- **Fase 1:** aplicada — ver `docs/operations/REBRAND_QUEGYM_PLAN.md` y `apps/web/src/lib/brand.ts`.
- **No aplicar Fase 2+** (tokens CSS, `localStorage`, cookies, eventos, `@quegym/*`) sin PR y runbook de migración explícitos.

## 6) Definition of done mínima por iteración

- contratos alineados (OpenAPI/JSON si aplica),
- tests verdes de la capability afectada,
- evidencia de validación ejecutable (script/gate/checklist),
- actualización documental obligatoria:
  - `docs/operations/sprints.md`
  - `docs/operations/EPICS_USER_STORIES_STATUS.md`
  - `docs/operations/PROJECT_CONTEXT_HANDOVER.md`
  - este `docs/operations/NEXT_AGENT_BRIEF.md` (si cambió la prioridad).
