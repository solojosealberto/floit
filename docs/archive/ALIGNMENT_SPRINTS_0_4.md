# Floit — verificación de coherencia y alineación (Sprints 0–4)

Documento de trazabilidad entre lo implementado en Sprints 0, 1, 2, 3 y 4, y las fuentes rectoras:

- `docs/product/BACKLOG.md`
- `docs/product/PRD.md`
- `docs/product/PLAN_MAESTRO.md`
- `docs/product/PLAN_PROMPT_ENGINEERING.md`

---

## Resumen ejecutivo

- La ejecución de Sprints 0–4 mantiene coherencia secuencial: fundaciones -> discovery -> conversión -> operación partner/admin.
- El alcance funcional permanece dentro del núcleo MVP definido por backlog/PRD (discovery, comparación, leads, partner lite, operación admin).
- La arquitectura aplicada respeta bounded contexts y BFF, y evoluciona hacia patrones de resiliencia (colas, DLQ, outbox fase 1).
- El flujo de trabajo sigue lineamientos de prompt engineering: contrato-first en OpenAPI, slices verticales y hardening incremental.
- Pendientes clave para cerrar Sprint 4 al 100% operativo: activación OIDC-only en staging/prod y conexión de outbox a broker externo.

---

## Coherencia entre sprints

| Sprint | Coherencia interna | Evidencia |
|---|---|---|
| 0 | Alta: establece base monorepo, contratos y reglas de trabajo para escalar sin drift | `AGENTS.md`, `.cursor/rules/*`, `openapi/*`, `pnpm-workspace.yaml` |
| 1 | Alta: implementa discovery core sobre fundaciones de Sprint 0 | `services/catalog`, `services/search`, `apps/web/src/app/buscar` |
| 2 | Alta: amplía producto con optimización comercial y embudo sin romper discovery | relevancia/promos/reportes/duplicados + favoritos/comparar/SEO + leads/analytics |
| 3 | Alta: endurece conversión y operación (anti-spam, admin leads, export, Turnstile, E2E) | `leads-service`, `apps/web/admin`, Playwright/CI |
| 4 | Alta parcial: cierra partner/admin operativo y seguridad gradual; faltan pasos de despliegue final | claim+ownership+perfil/planes+inbox, OIDC rollout, outbox fase 1, health/readiness |

---

## Alineación con Backlog

| Grupo backlog | Estado | Evidencia principal |
|---|---|---|
| Epic 1/2 (discovery, ficha, comparador) | Alto cumplimiento | S1/S2 completan búsqueda/filtros/lista-mapa/ficha/comparar |
| Epic 3 (lead + contacto + confirmación) | Alto cumplimiento | S2/S3 completan formulario, estado, confirmación, contacto directo |
| Epic 4 (partner claim/perfil/planes/leads) | Alto cumplimiento (lite) | S4 implementa claim, ownership, perfil, planes, inbox y operación admin |
| Epic 5 (admin operativo) | Alto cumplimiento parcial | leads admin/export y operación claims/ownership; pendiente moderación visual avanzada |
| Epic 6 (analytics/experimentos) | Parcial-alto | eventos/funnel base presentes; A/B y experimentos avanzados pendientes |
| Epic 7 (confianza/seguridad) | Alto cumplimiento | consentimiento, anti-spam, badges, reportes, OIDC gradual |
| Epic 8 (enablers) | Alto cumplimiento | mobile-first, performance base, SEO, RBAC, CI/E2E |

---

## Alineación con PRD

| Pilar PRD | Estado | Verificación |
|---|---|---|
| Discovery + comparación + lead marketplace | Alineado | Se mantiene como núcleo funcional desde S1 a S4 |
| Partner panel lite + operación asistida | Alineado | S4 entrega panel funcional y controles admin |
| Seguridad y confianza | Alineado | OIDC configurable, anti-spam, consent, auditoría, readiness |
| No desviar a pagos/reservas complejas en MVP | Alineado | No se implementan flujos transaccionales fuera de piloto |
| Medición del funnel | Alineado parcial | eventos y panel base listos; experimentación avanzada pendiente |

---

## Alineación con Plan maestro

| Lineamiento del plan maestro | Estado | Evidencia |
|---|---|---|
| Bounded contexts y microservicios moderados | Alineado | `catalog/search/leads/partner/analytics` diferenciados |
| BFF como capa de composición | Alineado | `apps/web/src/app/api/*` para admin/partner/leads |
| Contratos estrictos | Alineado | OpenAPI actualizado en cada iteración |
| Evolución a outbox/event-driven | Alineado parcial | Outbox fase 1 implementado en partner, falta broker externo |
| OIDC/RBAC partner/admin | Alineado | guards OIDC, flags strict, runbook y readiness |

---

## Alineación con Plan de prompt engineering

| Principio | Estado | Evidencia |
|---|---|---|
| Contrato-first | Alto | Cambios de API reflejados en `openapi/*.yaml` |
| Vertical slices end-to-end | Alto | Cada bloque incluye backend + BFF/UI + docs + env |
| Reglas y contexto persistente | Alto | uso sostenido de `AGENTS.md` y `.cursor/rules/*.mdc` |
| Hardening incremental | Alto | DLQ/retry/outbox/readiness por iteraciones |
| Validación operativa antes de rollout | Alto parcial | runbook + health/readiness listos; falta ejecución en staging |

---

## Brechas abiertas y acciones recomendadas

1. **OIDC-only en entorno real**
   - Activar en staging: `ADMIN_AUTH_REQUIRE_OIDC=true`, `PARTNER_AUTH_REQUIRE_OIDC=true`.
   - Ejecutar runbook `docs/operations/oidc-rollout-sprint4.md` y documentar evidencia de flujos admin/partner.

2. **Outbox -> broker externo**
   - Conectar outbox partner->catalog a NATS/Rabbit/SQS.
   - Mover publicación/procesamiento a worker desacoplado del proceso HTTP.

3. **Cierre UX/operación partner panel**
   - Afinar estados de error/empty/success.
   - Añadir métricas operativas de respuesta partner para trazabilidad de valor de negocio.

---

## Criterio de "Sprint 4 cerrado"

Sprint 4 se considera cerrado cuando:

- Se valida OIDC-only en staging con evidencia operativa y sin uso de headers legacy/dev.
- `readiness.recommendedForStrictOidc=true` en `/health` de partner y leads en ventana de validación.
- Se define plan ejecutable de conexión a broker externo (o implementación inicial en branch siguiente).
