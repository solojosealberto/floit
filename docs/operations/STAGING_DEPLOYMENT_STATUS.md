# Estado del despliegue staging — QueGym

Registro operativo de lo configurado en proveedores (sin secretos). Fuente: informe *Configuración de ambientes* (mayo 2026), alineado a [`PRODUCTION_ACCOUNTS_SETUP.md`](./PRODUCTION_ACCOUNTS_SETUP.md).

**URL pública staging:** https://staging.quegym.com (verificado HTTP 200 en web).

**Catalog Railway:** https://floitcatalog-service-production.up.railway.app — `venues: 95`.  
**Search Railway:** https://floitsearch-service-production.up.railway.app — `/v1/search` OK (`meta.total: 95`) tras `CATALOG_SERVICE_URL` → catalog.  
**Vercel staging:** catalog + search configurados; `/buscar`, fichas y `/api/compare/search` OK (2026-05-26).  
**URLs leads / partner / analytics (Railway):** registradas 2026-05-26 — **salud HTTP OK** (`/health` 200 en los tres).  
**Pendiente:** confirmar `LEADS_*` / `PARTNER_*` / `ANALYTICS_*` en Vercel y cerrar evidencias Sprint 4/5.

---

## Resumen ejecutivo

| Fase | Estado | Notas |
|------|--------|-------|
| Paso 2 — Cuentas e infra (§0–§5) | **Completado** | Neon, Railway, Auth0, Vercel, DNS `staging` |
| Paso 3 — Datos y validación | **En curso (avanzado)** | Import + health 5/5 + smoke OK; faltan gates/evidencias formales |
| Paso 4 — Producción `www` | **Pendiente** | Tras GO/NO-GO staging |

---

## Checklist maestro (actualizado)

| # | Tarea | Estado | Fecha ref. |
|---|--------|--------|------------|
| 0 | Tokens S2S (`openssl rand -hex 32`) | ✅ | 2026-05 |
| 1 | Neon `quegym` + 4 DB + PostGIS | ✅ | us-east-1 |
| 2 | Railway `quegym-api` + 5 servicios | ✅ | Repo `solojosealberto/floit` |
| 3 | Auth0 APIs + Partner Web + Admin M2M | ✅ | Audiences `floit-admin`, `floit-partner` |
| 4 | Vercel `floit-web` (`apps/web`) | ✅ | Node 20.x |
| 5 | GoDaddy CNAME `staging` | ✅ | Ver DNS abajo |
| 6 | Variables Vercel + Railway | ✅ | Vault; no en git |
| 7 | Import catálogo Neon staging | ✅ | 2026-05-26 — **95 created**; `/health/ready` → `venues:95` |
| 7b | Fix crash partner Railway (`express`) | ✅ | `services/partner/package.json` (commit `08633b0`) |
| 7c | Fix TypeORM Postgres (`datetime` → `timestamptz`) | ✅ | 8 entidades partner + helper `typeorm-column-types.ts`; leads alineado; Railway PR #1 absorbido en `main` |
| 8 | Smoke + evidencias Sprint 4/5 | ☐ | `smoke:platform` OK (5/5); pendientes evidencias Sprint 4/5 + decisión GO/NO-GO |
| 9 | Dominio prod `www.quegym.com` | ☐ | Post GO |

---

## Inventario por proveedor (sin secretos)

### Neon (D3 + D6)

| Recurso | Valor |
|---------|--------|
| Proyecto | `quegym` |
| Región | `us-east-1` |
| Bases | `catalog`, `partner`, `leads`, `analytics` |
| PostGIS | `postgis`, `postgis_topology` en `catalog` |
| Connection strings | En vault / Railway (`DATABASE_URL` por servicio) |

### Railway (D2)

| Recurso | Valor |
|---------|--------|
| Proyecto | `quegym-api` |
| Red privada | Habilitada entre servicios |
| Repo | `https://github.com/solojosealberto/floit` |

| Servicio | Paquete | Puerto | URL pública staging | `/health` (2026-05-26) |
|----------|---------|--------|----------------------|-------------------------|
| catalog | `@floit/catalog-service` | 4010 | `https://floitcatalog-service-production.up.railway.app` | OK |
| search | `@floit/search-service` | 4011 | `https://floitsearch-service-production.up.railway.app` | OK |
| leads | `@floit/leads-service` | 4012 | `https://floitleads-service-production.up.railway.app` | **OK** (2026-05-26) |
| partner | `@floit/partner-service` | 4013 | `https://floitpartner-service-production.up.railway.app` | **OK** (2026-05-26, commit `210775e`) |
| analytics | `@floit/analytics-service` | 4014 | `https://floitanalytics-service-production.up.railway.app` | **OK** (2026-05-26, commit `8ce3a63`) |

| Servicio | DB / deps |
|----------|-----------|
| catalog | Neon `catalog`; `DATABASE_SYNC=false`, `SEED_ON_BOOT=false` |
| search | `CATALOG_SERVICE_URL` → catalog (HTTPS público o red privada) |
| leads | Neon `leads`; `DATABASE_SYNC=true` (1ª vez) → `false`; OIDC admin si `ADMIN_AUTH_REQUIRE_OIDC=true` |
| partner | Neon `partner`; tokens S2S + OIDC; `CATALOG_SERVICE_URL` interno o público |
| analytics | Neon `analytics`; servicio y dominio públicos verificados (`/health` 200) |

**Build / start (todos):** raíz monorepo — `pnpm install --frozen-lockfile && pnpm --filter <paquete> build` → `pnpm --filter <paquete> start`.

**Nota:** Se retiró despliegue de `@floit/web` en Railway (web solo en Vercel).

### Auth0 (D4)

| Recurso | Identifier / tipo |
|---------|-------------------|
| API Admin | `floit-admin` (RS256) |
| API Partner | `floit-partner` (RS256) |
| App Partner | QueGym Partner Web — Regular Web; grants **Password** + **Authorization Code** |
| App Admin BFF | QueGym Admin BFF — M2M → `floit-admin` |
| Callbacks | `https://staging.quegym.com/partner/auth/callback`, `https://www.quegym.com/partner/auth/callback` |

### Vercel (D1)

| Recurso | Valor |
|---------|--------|
| Proyecto | `floit-web` |
| Root | `apps/web` |
| Install | `cd ../.. && pnpm install --frozen-lockfile` |
| Build | `cd ../.. && pnpm --filter @floit/web build` |
| Node | 20.x |
| Dominio staging | `staging.quegym.com` (entorno Preview según configuración actual) |
| `NEXT_PUBLIC_SITE_URL` | `https://staging.quegym.com` |

**Variables BFF:** URLs de los 5 servicios Railway (públicas `*.up.railway.app` o placeholders durante el ajuste), Auth0 issuer/audiences, M2M admin, partner OIDC.

**Staging — política auth web (acordada):**

- `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD=true` (hasta OIDC browser admin).
- `ADMIN_LOCAL_LOGIN_EMAIL` + `ADMIN_LOCAL_LOGIN_PASSWORD` (credenciales del formulario; solo vault).
- `NEXT_PUBLIC_SITE_URL=https://staging.quegym.com` (requerido para habilitar login local con `NODE_ENV=production` en Vercel; ver `admin-local-login.ts`, commit `7554d6c`).
- `ADMIN_API_TOKEN` — **mismo valor** en Vercel y en Railway (`catalog`, `leads`, `partner`); generar con `openssl rand -hex 32` si no existe en vault. No confundir con `CATALOG_INTERNAL_API_TOKEN` / `LEADS_INTERNAL_API_TOKEN`.
- `ADMIN_AUTH_REQUIRE_OIDC=false` en BFF staging.
- `PARTNER_AUTH_REQUIRE_OIDC=true` en servicios; login partner vía Auth0 Password grant.

**Login admin — troubleshooting (`admin_login_not_enabled`):**

1. Variables en entorno **Preview** (dominio `staging.quegym.com`), no solo Production.
2. `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD` exactamente `true` (minúsculas).
3. Código desplegado ≥ `7554d6c` (fix `admin-local-login.ts`).
4. Redeploy Vercel tras cambiar env.

### GoDaddy DNS (D5) — staging

| Tipo | Host | Destino | TTL |
|------|------|---------|-----|
| CNAME | `staging` | `df46f0c75f1e085a.vercel-dns-017.com` | 600 s |

Dominio gestionado: **quegym.com**. Producción `www` y forward `@` → **no configurados** (correcto pre-GO).

---

## Brechas conocidas (del informe + verificación)

1. **Vercel BFF** — confirmar `LEADS_SERVICE_URL`, `PARTNER_SERVICE_URL`, `ANALYTICS_SERVICE_URL` (sin `/` final) y redeploy.
2. **BFF → APIs** — validar rutas admin/partner luego del redeploy (200 HTML no garantiza upstream OK).
3. **Evidencia formal** — Sprint 4 PASS (readiness + auth-negative). Sprint 5 **parcial**: auth M2M Auth0 OK (Bearer pasa guard; legacy 401); **HTTP 500** en `/v1/admin/leads*` y analytics `/v1/metrics/*` → revisar `DATABASE_SYNC=true` una vez en Railway **leads** y **analytics**, redeploy, luego `false`.
4. **Vercel** — añadir `ADMIN_OIDC_ACCESS_TOKEN` (M2M; `pnpm auth0:m2m-token`) en Preview y redeploy para que `/admin/leads` deje de fallar vía BFF.
4. **Admin UI staging** — validar login `/admin/login` tras deploy `7554d6c` + env Preview; luego E2E `/admin/leads`.
5. **Prod** — `www.quegym.com`, apex redirect y OIDC-only sin passwords locales: pendiente.

---

## Planificación — Paso 3 (continuar deployment)

Orden recomendado para la **siguiente sesión operativa**:

### Bloque A — Datos (bloqueante)

1. Confirmar `catalog` en Railway: `GET /health` y tablas creadas (`DATABASE_SYNC` ya corrió una vez).
2. Copiar [`docs/env/staging.local.example`](../env/staging.local.example) → `docs/env/staging.local` con `DATABASE_URL` (Neon catalog) + `CATALOG_INTERNAL_API_TOKEN` (vault).
   ```bash
   export PATH="$(pwd)/.cursor-bin:$PATH"
   pnpm staging:bootstrap
   ```
   Alternativa solo HTTP: `pnpm venues:import:staging` (mismo archivo env).

   Catalog URL: `https://floitcatalog-service-production.up.railway.app`
3. Validar conteo: `pnpm venues:validate:live` / `pnpm venues:audit` contra URL de catalog staging.
4. Fijar `DATABASE_SYNC=false` en Railway catalog si aún no está.

### Bloque B — Conectividad BFF

1. En Railway: generar o anotar URLs públicas `*.up.railway.app` por servicio (o documentar hostnames de red privada si se usa integración futura).
2. Actualizar en **Vercel** (Preview/staging): `CATALOG_*`, `SEARCH_*`, `LEADS_*`, `PARTNER_*`, `ANALYTICS_*`.
3. Redeploy Vercel; probar manual: `/buscar`, ficha gym, `POST /api/leads` (formulario), `/admin/login`, `/partner/login`.

### Bloque C — Validación y GO staging

1. `SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform`
2. `LEADS_HEALTH_URL=... PARTNER_HEALTH_URL=... pnpm sprint4:gate` (URLs públicas Railway)
3. `pnpm sprint5:flow-checklist` y `pnpm sprint5:kpi-gate` con auth admin resuelto (M2M o token staging)
4. Rellenar [`STAGING_EVIDENCE_SPRINT4.md`](./STAGING_EVIDENCE_SPRINT4.md) y [`STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md) → decisión **GO/NO-GO**
5. Checklist visual: [`UI_VISUAL_QA_CHECKLIST.md`](../ux/UI_VISUAL_QA_CHECKLIST.md)

### Bloque D — Producción (solo tras GO)

1. Vercel: dominio `www.quegym.com` (Production); `NEXT_PUBLIC_SITE_URL=https://www.quegym.com`
2. GoDaddy: CNAME `www` + forward `@` → `https://www.quegym.com`
3. Auth0: revisar callbacks prod; **desactivar** `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD` y passwords locales partner si aplica
4. Import catálogo en Neon **prod** (proyecto/branch separado si se usa branching)
5. Cutover según §14 de [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md)

---

## Referencias

- Guía alta: [`PRODUCTION_ACCOUNTS_SETUP.md`](./PRODUCTION_ACCOUNTS_SETUP.md)
- Plan GO LIVE: [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md)
- Import datos: [`VENUES_CATALOG_IMPORT.md`](./VENUES_CATALOG_IMPORT.md)
- Plantilla env: [`docs/env/production.example`](../env/production.example)
- Próximos pasos priorizados: [`NEXT_STEPS_RECOMMENDED.md`](./NEXT_STEPS_RECOMMENDED.md)
- Agente GPT: [`GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md`](./GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md)
- Última ejecución agente: [`STAGING_AGENT_EXECUTION_REPORT.md`](./STAGING_AGENT_EXECUTION_REPORT.md) (2026-05-26)
- Login admin staging: `apps/web/src/lib/admin-local-login.ts` (`7554d6c`)

*Actualizado 2026-05-27: health 5/5, smoke PASS, fix login admin Vercel staging; Sprint 4 PASS, Sprint 5 NO-GO (SLA 401).*
