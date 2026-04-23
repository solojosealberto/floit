# Floit — runbook de despliegue y pruebas

Guía operativa para dejar la plataforma desplegable y validarla end-to-end.

## 1) Conexión a repositorio

- Remote configurado:
  - `origin`: `https://github.com/solojosealberto/floit.git`

Comandos de referencia:

- `git remote -v`
- `git fetch origin`

## 2) Preflight de entorno

Ejecuta:

- `pnpm platform:preflight`

Valida:

- Node.js / pnpm
- Docker runtime (requerido por Testcontainers)
- Remote Git
- Health de `web`, `catalog`, `search`, `leads`, `partner`, `analytics`

## 3) Levantar servicios locales

1. Base de datos catálogo:
   - `pnpm docker:up`
2. Servicios backend:
   - `pnpm dev:services`
3. Frontend:
   - `pnpm dev:web`

## 4) Ejecutar pruebas por capa

- Unit:
  - `pnpm test:unit`
- Contract OpenAPI:
  - `pnpm test:contract`
- Integration (Testcontainers):
  - `pnpm test:integration`
- E2E Playwright:
  - `E2E_WITH_SERVICES=1 pnpm test:e2e`

Todo junto:

- `pnpm test:capability`

## 5) Gates funcionales Sprint

- Checklist de flujo:
  - `pnpm sprint5:flow-checklist`
- Gate KPI:
  - `pnpm sprint5:kpi-gate`
- Gate auth/OIDC (si aplica entorno):
  - `pnpm sprint4:gate`

## 6) Evidencia de staging y GO/NO-GO

Completar:

- `docs/STAGING_EVIDENCE_SPRINT5.md`
- `docs/STAGING_EVIDENCE_SPRINT4.md` (cuando aplique auth rollout)

Apóyate en:

- `docs/TEST_MATRIX_SEARCH_PROFILE_COMPARE_LEAD.md`
