# Estado del despliegue staging — QueGym

Registro operativo de lo configurado en proveedores (sin secretos). Fuente: informe *Configuración de ambientes* (mayo 2026), alineado a [`PRODUCTION_ACCOUNTS_SETUP.md`](./PRODUCTION_ACCOUNTS_SETUP.md).

**URL pública staging:** https://staging.quegym.com (verificado HTTP 200 en web).

**Catalog Railway:** https://floitcatalog-service-production.up.railway.app — `/health` OK; `/health/ready` indica **`relation "venues" does not exist`** (falta schema/sync en Neon o import).

---

## Resumen ejecutivo

| Fase | Estado | Notas |
|------|--------|-------|
| Paso 2 — Cuentas e infra (§0–§5) | **Completado** | Neon, Railway, Auth0, Vercel, DNS `staging` |
| Paso 3 — Datos y validación | **En curso** | Falta import catálogo + smoke/gates formales |
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
| 7 | Import catálogo Neon staging | ☐ | `docs/env/staging.local` + `pnpm staging:bootstrap` (o `DATABASE_SYNC=true` una vez en Railway) |
| 8 | Smoke + evidencias Sprint 4/5 | ☐ | Tras import y URLs API estables |
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

| Servicio | Paquete | Puerto | URL pública staging (Railway) |
|----------|---------|--------|-------------------------------|
| catalog | `@floit/catalog-service` | 4010 | `https://floitcatalog-service-production.up.railway.app` |

| Servicio | DB / deps |
|----------|-----------|
| catalog | Neon `catalog`; `DATABASE_SYNC=false`, `SEED_ON_BOOT=false` |
| search | `@floit/search-service` | 4011 | `CATALOG_SERVICE_URL` → catalog (red privada) |
| leads | `@floit/leads-service` | 4012 | Neon `leads`; OIDC admin strict en servicio |
| partner | `@floit/partner-service` | 4013 | Neon `partner`; tokens S2S + OIDC |
| analytics | `@floit/analytics-service` | 4014 | Neon `analytics` |

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
- `ADMIN_AUTH_REQUIRE_OIDC=false` en BFF staging.
- `PARTNER_AUTH_REQUIRE_OIDC=true` en servicios; login partner vía Auth0 Password grant.

### GoDaddy DNS (D5) — staging

| Tipo | Host | Destino | TTL |
|------|------|---------|-----|
| CNAME | `staging` | `df46f0c75f1e085a.vercel-dns-017.com` | 600 s |

Dominio gestionado: **quegym.com**. Producción `www` y forward `@` → **no configurados** (correcto pre-GO).

---

## Brechas conocidas (del informe + verificación)

1. **Tabla `venues` ausente en Neon** — `/health/ready` en catalog Railway devuelve `relation "venues" does not exist`. Corregir con `pnpm staging:bootstrap` (local + `DATABASE_URL` en `docs/env/staging.local`) **o** `DATABASE_SYNC=true` en Railway catalog → redeploy → volver a `false`.
2. **Catálogo sin datos importados** — pendiente `pnpm venues:import:staging` o paso 3 del bootstrap.
2. **URLs de microservicios en Vercel** — pueden estar en dominios Railway públicos temporales; conviene fijar URLs finales y validar `/health` de cada servicio desde la máquina de ops.
3. **BFF → APIs** — si las URLs en Vercel no apuntan a endpoints alcanzables, `/buscar` y flujos admin/partner fallarán aunque la home cargue (200 en HTML no implica APIs OK).
4. **Evidencia formal** — `STAGING_EVIDENCE_SPRINT4.md` / `STAGING_EVIDENCE_SPRINT5.md` sin rellenar.
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
- Última ejecución agente: [`STAGING_AGENT_EXECUTION_REPORT.md`](./STAGING_AGENT_EXECUTION_REPORT.md) (2026-05-25, **NO-GO**)

*Actualizar este documento al cerrar import, smoke PASS y GO/NO-GO.*
