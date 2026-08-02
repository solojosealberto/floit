# Vocabulario de estado (humanos + agentes)

Usar **exactamente** estos términos en brief, evidencias, trinity y AGENTS. Evitar «gates PASS» sin calificador.

## Gates Sprint 5

| Término | Significado |
|---------|-------------|
| `PASS relaxed` | `pnpm sprint5:staging-gate -- --kpi-relaxed` verde (umbrales relajados) |
| `PASS PRD n/17` | Gate PRD con `n` checks en verde (ej. `PASS PRD 16/17`) |
| `PASS PRD 17/17` | Gate PRD completo — requisito técnico para GO formal beta |
| `FAIL PRD` | Uno o más checks PRD en rojo — **anotar fecha del run** |

## Decisiones de lanzamiento

| Término | Significado |
|---------|-------------|
| `GO técnico condicional` | Infra + smoke + auth OK; KPI PRD o firma producto aún abiertos |
| `GO producto/ops` | Firma humana explícita en evidencia Sprint 4/5 |
| `NO-GO` | Bloqueo documentado (causa + owner + next) |
| `Cutover prod` | DNS/Vercel `www.quegym.com` tras `GO producto/ops` |

## Validaciones

| Término | Significado |
|---------|-------------|
| `QA visual PASS` | Checklist UI firmado en staging — **no reabrir** salvo regresión |
| `E2E lead API PASS` | `POST /api/leads` + lead visible en admin (M2M/API) |
| `E2E checklist §2–3` | Flujo manual usuario/partner en `STAGING_EVIDENCE_SPRINT5.md` — distinto del API |
| `Smoke PASS` | `pnpm smoke:platform` contra staging + Railway |

## Documentación

| Término | Significado |
|---------|-------------|
| `CURRENT TRUTH` | Solo [`NEXT_AGENT_BRIEF.md`](./NEXT_AGENT_BRIEF.md) |
| `Histórico` | Bloque de evidencia/informe **no** usar para prioridad |
| `Superseded` | Runbook/informe reemplazado; leer solo contexto |
| `status: done` (planes) | Plan de implementación cerrado; no re-ejecutar fases completadas |

## Trinidad operativa

| Doc | Rol |
|-----|-----|
| `NEXT_AGENT_BRIEF.md` | Estado vivo + next actions |
| `sprints.md` | Ledger de entrega por sprint (append + corregir pendientes obsoletos) |
| `EPICS_USER_STORIES_STATUS.md` | Matriz épicas/US |
| `PROJECT_CONTEXT_HANDOVER.md` | Contexto arquitectura/ops **sin** competir en «próxima sesión» |
