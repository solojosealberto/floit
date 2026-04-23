# Sprint 4 — plantilla de evidencias (staging)

Plantilla para registrar evidencia objetiva antes de marcar Sprint 4 como cerrado y activar OIDC-only en producción.

Referencias:

- Runbook: [`docs/oidc-rollout-sprint4.md`](./oidc-rollout-sprint4.md)
- Sprints: [`docs/SPRINTS.md`](./SPRINTS.md)
- Alineación: [`docs/ALIGNMENT_SPRINTS_0_4.md`](./ALIGNMENT_SPRINTS_0_4.md)

---

## Metadatos de ejecución

| Campo | Valor |
|---|---|
| Fecha |  |
| Entorno | staging |
| Release/commit |  |
| Responsable técnico |  |
| Responsable producto/ops |  |
| Ventana de validación |  |
| Resultado `pnpm sprint4:readiness` |  |
| Resultado `pnpm sprint4:auth-negative` |  |
| Resultado `pnpm sprint4:gate` |  |

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
| Leads: `ADMIN_AUTH_REQUIRE_OIDC=true` | Activo |  |  |
| Leads: `ADMIN_OIDC_ISSUER` configurado | Sí |  |  |
| Partner: `ADMIN_AUTH_REQUIRE_OIDC=true` | Activo |  |  |
| Partner: `PARTNER_AUTH_REQUIRE_OIDC=true` | Activo |  |  |
| Partner: `ADMIN_OIDC_ISSUER` configurado | Sí |  |  |
| Partner: `PARTNER_OIDC_ISSUER` configurado | Sí |  |  |
| Web: `ADMIN_AUTH_REQUIRE_OIDC=true` | Activo |  |  |
| Web: `PARTNER_AUTH_REQUIRE_OIDC=true` | Activo |  |  |
| Web: tokens server-side OIDC configurados | Sí |  |  |

---

## 2) Health y readiness

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Leads `/health` -> `adminStrictOidc=true` | Sí |  |  |
| Leads `/health` -> `adminOidcConfigured=true` | Sí |  |  |
| Partner `/health` -> `adminStrictOidc=true` | Sí |  |  |
| Partner `/health` -> `partnerStrictOidc=true` | Sí |  |  |
| Partner `/health` -> `adminOidcConfigured=true` | Sí |  |  |
| Partner `/health` -> `partnerOidcConfigured=true` | Sí |  |  |
| Partner `/health` -> `readiness.oidcConfigReady=true` | Sí |  |  |
| Partner `/health` -> `readiness.queuesHealthy=true` | Sí |  |  |
| Partner `/health` -> `readiness.recommendedForStrictOidc=true` | Sí |  |  |

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
| `x-admin-token` sin bearer en strict=true | 401 |  |  |
| `x-partner-email` sin bearer en strict=true | 401 |  |  |

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
| OIDC-only validado en staging (admin + partner) |  |
| Fallbacks legacy/dev bloqueados en strict mode |  |
| Colas y outbox estables (failed=0 al cierre) |  |
| Operación admin/partner sin regresiones críticas |  |
| Aprobación conjunta tech + producto/ops |  |

**Decisión final:** `GO` / `NO-GO`

**Firmas (nombre/fecha):**

- Tech lead:
- Producto:
- Operaciones:

