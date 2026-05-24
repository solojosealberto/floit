# QueGym — runbook de despliegue y pruebas

Guía operativa para dejar la plataforma desplegable y validarla end-to-end.

## 1) Conexión a repositorio

- Remote configurado:
  - `origin`: `https://github.com/solojosealberto/floit.git`

Comandos de referencia:

- `git remote -v`
- `git fetch origin`

## 2) Preflight de entorno

### pnpm en PATH (macOS / Cursor)

Si `pnpm dev:services` falla con `pnpm: command not found`, el monorepo incluye un binario local:

```bash
export PATH="/ruta/al/repo/FLOIT v.0.2/.cursor-bin:$PATH"
```

O desde la raíz del repo (sesión actual):

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
```

Verificar: `pnpm -v` → debe responder (p. ej. `9.15.4`).

### Preflight script

Ejecuta:

- `pnpm platform:preflight`

Valida:

- Node.js / pnpm
- Docker runtime (requerido por Testcontainers)
- Remote Git
- Health de `web`, `catalog`, `search`, `leads`, `partner`, `analytics` (si ya están en marcha)

## 3) Levantar servicios locales

1. Base de datos catálogo:
   - `pnpm docker:up`
2. Servicios backend (con PATH de `.cursor-bin` si aplica):
   - `pnpm dev:services`
3. Frontend:
   - `pnpm dev:web`

Puertos: catalog `4010`, search `4011`, leads `4012`, partner `4013`, analytics `4014`, web `3000` (o el siguiente libre que indique Next).

Variables mínimas: ver `docs/env/local.example` y `apps/web/.env.local` (`ADMIN_API_TOKEN`, logins locales admin/partner).

## 4) Ejecutar pruebas por capa

- Unit:
  - `pnpm test:unit`
- Contract OpenAPI:
  - `pnpm test:contract`
- Integration (Testcontainers):
  - `pnpm test:integration`
- Smoke HTTP servicios:
  - `pnpm smoke:local`
- Smoke plataforma (discovery + ficha + web opcional):
  - `SMOKE_WEB_BASE=http://127.0.0.1:3000 pnpm smoke:platform`
- E2E Playwright (primera vez: `cd apps/web && npx playwright install chromium`):
  - `pnpm test:e2e`
  - Con API partner para claim: `E2E_WITH_SERVICES=1 pnpm test:e2e`

Todo junto (sin E2E API partner):

- `pnpm test:capability`

## 5) QA manual recomendado (credenciales locales)

Ver `docs/operations/LOCAL_TEST_CREDENTIALS.md` y `docs/operations/LOCALHOST_LINKS_GUIDE.md`.

### Admin

- Login: `http://localhost:3000/admin/login`
- Configuración: `/admin/configuracion`
- Catálogo / duplicados / taxonomías / leads / partner-claims

### Partner

- Login: `http://localhost:3000/partner/login`
- Sembrar ownership (si el demo no tiene centro):

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
cd services/partner
node ./scripts/seed-ownership.mjs --email partner.demo@floit.local --venue gym-fitness-caracas --status active
```

- Panel: `http://localhost:3000/partner/panel?venueSlug=gym-fitness-caracas`

## 6) Catálogo importado (~95 venues)

Normalizar y reimportar tras cambios en `scripts/venues-import/`:

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
pnpm venues:normalize          # o --skip-geocode para solo cache/URLs
pnpm venues:import
pnpm venues:audit
pnpm venues:validate:live
```

Documentación: `docs/operations/VENUES_CATALOG_IMPORT.md`.

## 7) Gates funcionales Sprint

- Checklist de flujo:
  - `pnpm sprint5:flow-checklist`
- Gate KPI:
  - `pnpm sprint5:kpi-gate`
- Gate auth/OIDC (si aplica entorno):
  - `pnpm sprint4:gate`

## 8) Evidencia de staging y GO/NO-GO

Completar:

- `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
- `docs/operations/STAGING_EVIDENCE_SPRINT4.md` (cuando aplique auth rollout)

Apóyate en:

- `docs/operations/TEST_MATRIX_SEARCH_PROFILE_COMPARE_LEAD.md`

## 9) Rebrand QueGym

Marca visible Fase 1 aplicada. Plan de fases técnicas: `docs/operations/REBRAND_QUEGYM_PLAN.md`.
