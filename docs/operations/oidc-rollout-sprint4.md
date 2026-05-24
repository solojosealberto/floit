# Sprint 4 — rollout OIDC-only (staging -> producción)

Este runbook alinea la transición de autenticación con los planes de desarrollo, PRD y backlog: seguridad por rol y eliminación de credenciales legacy.

Plantilla de evidencias de ejecución: [`docs/operations/STAGING_EVIDENCE_SPRINT4.md`](./operations/STAGING_EVIDENCE_SPRINT4.md).

## Objetivo

- Activar OIDC obligatorio para admin y partner.
- Validar flujos E2E con tokens reales.
- Retirar fallbacks (`x-admin-token`, `x-partner-email`) en la siguiente iteración.

## Variables mínimas por entorno

### Leads service

- `ADMIN_AUTH_REQUIRE_OIDC=true`
- `ADMIN_OIDC_ISSUER=...`
- `ADMIN_OIDC_AUDIENCE=floit-admin` (o valor del IdP)
- `ADMIN_OIDC_JWKS_URL=...` (opcional si el well-known aplica)

### Partner service

- `ADMIN_AUTH_REQUIRE_OIDC=true`
- `PARTNER_AUTH_REQUIRE_OIDC=true`
- `ADMIN_OIDC_ISSUER=...`
- `PARTNER_OIDC_ISSUER=...`
- `PARTNER_OIDC_AUDIENCE=floit-partner`
- `PARTNER_OIDC_JWKS_URL=...` (opcional)

### Web (BFF)

- `ADMIN_AUTH_REQUIRE_OIDC=true`
- `PARTNER_AUTH_REQUIRE_OIDC=true`
- `ADMIN_OIDC_ACCESS_TOKEN=...` (server-side)
- `PARTNER_OIDC_ACCESS_TOKEN=...` (server-side)

## Verificación pre-despliegue

1. `pnpm --filter @floit/leads-service typecheck`
2. `pnpm --filter @floit/partner-service typecheck`
3. `pnpm --filter @floit/web typecheck`
4. `pnpm verify`
5. `pnpm sprint4:readiness` (usa `LEADS_HEALTH_URL` / `PARTNER_HEALTH_URL` para staging)
6. `pnpm sprint4:auth-negative` (usa `LEADS_ADMIN_URL` / `PARTNER_ME_URL` para staging)
7. `pnpm sprint4:gate` para ejecutar ambos checks como gate único de cierre técnico.

## Verificación en staging

1. Health checks:
   - `GET /health` en leads y partner debe mostrar:
     - `adminStrictOidc: true`
     - `partnerStrictOidc: true` (partner)
     - `*OidcConfigured: true`
   - En partner validar además:
     - `readiness.oidcConfigReady: true`
     - `readiness.queuesHealthy: true`
     - `readiness.recommendedForStrictOidc: true`
2. Flujos admin:
   - `/admin/leads`
   - `/admin/partner-claims`
   - aprobar/rechazar claim
3. Flujos partner:
   - `/partner/leads`
   - `/partner/panel` (perfil + planes)
4. Validar que headers legacy fallen:
   - `x-admin-token` sin bearer debe devolver `401` cuando strict=true
   - `x-partner-email` sin bearer debe devolver `401` cuando strict=true

## Rollback

Si falla integración IdP:

- `ADMIN_AUTH_REQUIRE_OIDC=false`
- `PARTNER_AUTH_REQUIRE_OIDC=false`

Mantener issuer/jwks configurados para retomar rollout rápidamente.
