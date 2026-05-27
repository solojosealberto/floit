# Sprint 4 — plantilla de evidencias (staging)

Plantilla para registrar evidencia objetiva antes de marcar Sprint 4 como cerrado y activar OIDC-only en producción.

Referencias:

- Runbook: [`docs/operations/oidc-rollout-sprint4.md`](./operations/oidc-rollout-sprint4.md)
- Sprints: [`docs/operations/sprints.md`](./operations/sprints.md)
- Alineación: [`docs/archive/ALIGNMENT_SPRINTS_0_4.md`](./archive/ALIGNMENT_SPRINTS_0_4.md)

---

## Metadatos de ejecución

| Campo | Valor |
|---|---|
| Fecha | 2026-05-26 |
| Entorno | staging |
| Release/commit | `3838fe7` (base smoke 5/5) + `main` vigente |
| Responsable técnico | Agente + operador |
| Responsable producto/ops | Pendiente firma |
| Ventana de validación | 2026-05-26 21:50-22:10 UTC-4 |
| Resultado `pnpm sprint4:readiness` | PASS |
| Resultado `pnpm sprint4:auth-negative` | PASS |
| Resultado `pnpm sprint4:gate` | PASS (con URLs staging por env) |

---

## Ensayo técnico ejecutado (local, pre-staging)

Ejecución real realizada para validar el gate completo y la compatibilidad runtime antes de staging:

- Comando: `npx pnpm sprint4:gate`
- Contexto: servicios `leads` y `partner` arriba con `ADMIN_AUTH_REQUIRE_OIDC=true` y `PARTNER_AUTH_REQUIRE_OIDC=true`
- Resultado general: `PASS`

Salida clave observada:

- `Result: PASS (ready for OIDC-only rollout checks)` en `sprint4:readiness`
- `Result: PASS (legacy/dev headers are blocked)` en `sprint4:auth-negative`
- `PASS x-admin-token rejected in strict mode`
- `PASS x-partner-email rejected in strict mode`

Nota técnica asociada:

- Se corrigió compatibilidad Node 22 en guards OIDC (`jose` ESM) usando carga dinámica en:
  - `services/leads/src/admin-api.guard.ts`
  - `services/partner/src/admin-api.guard.ts`
  - `services/partner/src/partner-auth.guard.ts`

Este ensayo no reemplaza la evidencia formal de staging; reduce riesgo para la ventana de activación.

---

## 1) Configuración OIDC por servicio

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Leads: `ADMIN_AUTH_REQUIRE_OIDC=true` | Activo | PASS | `leads /health -> adminStrictOidc=true` |
| Leads: `ADMIN_OIDC_ISSUER` configurado | Sí | PASS | `leads /health -> adminOidcConfigured=true` |
| Partner: `ADMIN_AUTH_REQUIRE_OIDC=true` | Activo | PASS | `partner /health -> adminStrictOidc=true` |
| Partner: `PARTNER_AUTH_REQUIRE_OIDC=true` | Activo | PASS | `partner /health -> partnerStrictOidc=true` |
| Partner: `ADMIN_OIDC_ISSUER` configurado | Sí | PASS | `partner /health -> adminOidcConfigured=true` |
| Partner: `PARTNER_OIDC_ISSUER` configurado | Sí | PASS | `partner /health -> partnerOidcConfigured=true` |
| Web: `ADMIN_AUTH_REQUIRE_OIDC=true` | Activo | Pendiente | Requiere validación UI admin en staging |
| Web: `PARTNER_AUTH_REQUIRE_OIDC=true` | Activo | PASS (servicios) | Partner strict validado en servicio |
| Web: tokens server-side OIDC configurados | Sí | Pendiente | Validación E2E UI pendiente |

---

## 2) Health y readiness

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Leads `/health` -> `adminStrictOidc=true` | Sí | PASS | `pnpm sprint4:gate` |
| Leads `/health` -> `adminOidcConfigured=true` | Sí | PASS | `pnpm sprint4:gate` |
| Partner `/health` -> `adminStrictOidc=true` | Sí | PASS | `pnpm sprint4:gate` |
| Partner `/health` -> `partnerStrictOidc=true` | Sí | PASS | `pnpm sprint4:gate` |
| Partner `/health` -> `adminOidcConfigured=true` | Sí | PASS | `pnpm sprint4:gate` |
| Partner `/health` -> `partnerOidcConfigured=true` | Sí | PASS | `pnpm sprint4:gate` |
| Partner `/health` -> `readiness.oidcConfigReady=true` | Sí | PASS | `pnpm sprint4:gate` |
| Partner `/health` -> `readiness.queuesHealthy=true` | Sí | PASS | `failedQueues=0` |
| Partner `/health` -> `readiness.recommendedForStrictOidc=true` | Sí | PASS | `pnpm sprint4:gate` |

Comando sugerido para evidencia automatizada:

- `LEADS_HEALTH_URL=<url-staging-leads>/health PARTNER_HEALTH_URL=<url-staging-partner>/health pnpm sprint4:readiness`

---

## 3) Flujos admin E2E

| Flujo | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Abrir `/admin/leads` con token OIDC | 200/UI carga |  |  |
| Export CSV leads | descarga válida |  |  |
| Abrir `/admin/partner-claims` | UI + health + tablas visibles |  |  |
| Aprobar claim | status actualizado |  |  |
| Rechazar claim | status actualizado |  |  |
| Revocar ownership con motivo | evento de auditoría visible |  |  |
| Retry DLQ sync partner->catalog | contador/estado esperado |  |  |
| Retry DLQ outbox partner->sync | contador/estado esperado |  |  |

---

## 4) Flujos partner E2E

| Flujo | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Abrir `/partner/panel` con token OIDC | acceso permitido |  |  |
| Editar perfil | persistencia y reflejo esperado |  |  |
| Crear/editar plan | persistencia y reflejo esperado |  |  |
| Abrir `/partner/leads` | solo leads de venues con ownership activo |  |  |
| Tras revocación ownership | acceso a venue/leads revocado |  |  |

---

## 5) Validación de bloqueo legacy/dev headers

| Prueba | Esperado | Resultado | Evidencia |
|---|---|---|---|
| `x-admin-token` sin bearer en strict=true | 401 | PASS | `pnpm sprint4:auth-negative` contra URLs Railway |
| `x-partner-email` sin bearer en strict=true | 401 | PASS | `pnpm sprint4:auth-negative` contra URLs Railway |

Comando sugerido para evidencia automatizada:

- `LEADS_ADMIN_URL=<url-staging-leads>/v1/admin/leads?limit=1 PARTNER_ME_URL=<url-staging-partner>/v1/partner/me/leads?limit=1 pnpm sprint4:auth-negative`

Gate único recomendado (readiness + pruebas negativas):

- `LEADS_HEALTH_URL=<url-staging-leads>/health PARTNER_HEALTH_URL=<url-staging-partner>/health LEADS_ADMIN_URL=<url-staging-leads>/v1/admin/leads?limit=1 PARTNER_ME_URL=<url-staging-partner>/v1/partner/me/leads?limit=1 pnpm sprint4:gate`

---

## 6) Operación de colas y resiliencia

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| `catalogSync.failed` | 0 al cierre |  |  |
| `catalogSyncOutbox.failed` | 0 al cierre |  |  |
| DLQ de leads notificaciones | sin bloqueos críticos |  |  |
| Acciones de retry operativas desde admin | exitosas |  |  |

---

## 7) Incidencias y mitigaciones

| ID | Descripción | Severidad | Mitigación aplicada | Estado |
|---|---|---|---|---|
|  |  |  |  |  |

---

## 8) Decisión de cierre Sprint 4

| Criterio | Estado |
|---|---|
| OIDC-only validado en staging (admin + partner) | PASS (servicios + guards) |
| Fallbacks legacy/dev bloqueados en strict mode | PASS |
| Colas y outbox estables (failed=0 al cierre) | PASS |
| Operación admin/partner sin regresiones críticas | Pendiente validación E2E manual UI |
| Aprobación conjunta tech + producto/ops | Pendiente |

**Decisión final:** `GO técnico condicional` (pendiente firma producto/ops y E2E UI)

**Firmas (nombre/fecha):**

- Tech lead:
- Producto:
- Operaciones:

