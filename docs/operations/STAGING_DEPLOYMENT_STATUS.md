# Estado del despliegue staging — QueGym

Registro operativo de lo configurado en proveedores (sin secretos). Alineado a [`PRODUCTION_ACCOUNTS_SETUP.md`](./PRODUCTION_ACCOUNTS_SETUP.md).

**Estado vivo / next actions:** [`NEXT_AGENT_BRIEF.md`](./NEXT_AGENT_BRIEF.md) (este archivo = checklist infra + runbooks).

**URL pública staging:** https://staging.quegym.com (HTTP 200). **No existe** `www.staging.quegym.com` (NXDOMAIN).

**Catalog Railway:** https://floitcatalog-service-production.up.railway.app — `venues: 95`.  
**Search Railway:** https://floitsearch-service-production.up.railway.app — `/v1/search` OK (`meta.total: 95`).  
**Vercel staging:** commits `ca4070b`–`ff98be2` (+ `main` posterior); assets `/brand/` OK.  
**APIs Railway:** health **5/5** (catalog, search, leads, partner, analytics) — verificado 2026-08-02.  
**Auth admin:** M2M Auth0 + `ADMIN_OIDC_ACCESS_TOKEN` Preview; issuer fix `00fd9f9`.  
**Partner admin 500 (2026-08-02):** causa = JWKS `new URL` con issuer sin `https://` en `AdminApiGuard` (cualquier Bearer → 500). Fix en `main` (`services/partner/src/oidc-jose.ts`) — **redeploy partner Railway** y re-probar claims/profile; issuer debe ser URL absoluta `https://…`. Detalle: [`ADMIN_STAGING_QA_REPORT.md`](./ADMIN_STAGING_QA_REPORT.md).  
**Railway deploy SHA (analytics):** no anotado en panel — confirmar que el servicio incluye `f937abf` (+ fix partner) antes de depender de backdate.  
**Pendiente paso 3:** redeploy partner + auth catalog/Vercel → re-seed KPI → **PASS PRD 17/17** (`ANALYTICS_ALLOW_BACKDATE`) + firma GO/NO-GO.

---

## Resumen ejecutivo

| Fase | Estado | Notas |
|------|--------|-------|
| Paso 2 — Cuentas e infra (§0–§5) | **Completado** | Neon, Railway, Auth0, Vercel, DNS `staging` |
| Paso 3 — Datos y validación | **Casi cerrado** | Smoke PASS; QA visual PASS; E2E lead API PASS; KPI PRD requiere re-seed (ventana 7d) |
| Paso 4 — Producción `www` | **Pendiente** | Tras GO producto/ops |

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
| 7 | Import catálogo Neon staging | ✅ | 2026-06-14 — **95 updated** (`pnpm venues:import:staging --update`); audit UI 100% descripción limpia |
| 7d | Deploy web UX v0 en Vercel | ✅ | 2026-06-14 — commits `12a0870`/`b23fadb`/`d684837`; Vercel Production **success**; staging sirve rebrand Mint |
| 7e | Logotipo QueGym + menú móvil opaco | ✅ | `ca4070b`; assets `/brand/*.png` HTTP 200 |
| 7f | Placeholder imágenes venue (`VenueImage`) | ✅ | `ff98be2` — siglas + tokens `--qg-*`; deploy Vercel |
| 7b | Fix crash partner Railway (`express`) | ✅ | `services/partner/package.json` (commit `08633b0`) |
| 7c | Fix TypeORM Postgres (`datetime` → `timestamptz`) | ✅ | 8 entidades partner + helper `typeorm-column-types.ts`; leads alineado; Railway PR #1 absorbido en `main` |
| 8 | Smoke + evidencias Sprint 4/5 | ☐ | Smoke PASS; KPI PRD **FAIL** live (2026-08-02) — re-seed; ver § Cierre KPI 17/17 |
| 8a | `ANALYTICS_ALLOW_BACKDATE=true` (analytics Railway) | ☐ | Bloqueante para `stable days` 7/7 + simulación ventana |
| 8b | Auth M2M + fix issuer Auth0 | ✅ | `00fd9f9`; `pnpm auth0:m2m-token`; Vercel `ADMIN_OIDC_ACCESS_TOKEN` |
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

## Cierre KPI 17/17 — Railway analytics (paso a paso)

**Estado live (2026-08-02):** `pnpm sprint5:staging-gate` PRD → **FAIL PRD** (8 checks) — la ventana de ~7 días quedó sin el tráfico de junio. Pico histórico **PASS PRD 16/17** (2026-06-17): solo fallaba `stable days`.

**Por qué hace falta backdate + re-seed:** el gate exige **7 días distintos** con las tres variantes (`membership`, `trial`, `whatsapp_first`) con ≥1 `experiment_assignment`. En el pico de junio solo **2026-06-17** tenía las tres; además el volumen funnel/SLA caduca sin tráfico reciente:

| Fecha | membership | trial | whatsapp_first | Las 3 |
|-------|------------|-------|----------------|-------|
| 2026-06-17 | 42 | 35 | 35 | ✅ |
| Resto ventana 14d | parcial | parcial | parcial | ❌ |

**Código en `main`:** commit `f937abf` — analytics acepta `_stagingBackdateDays` en propiedades **solo si** `ANALYTICS_ALLOW_BACKDATE=true` en el servicio.

### Paso 1 — Railway: variable de entorno

1. Abrir [Railway Dashboard](https://railway.app/dashboard).
2. Proyecto: **`quegym-api`**.
3. Servicio: **`analytics`** (paquete `@floit/analytics-service`; URL pública `https://floitanalytics-service-production.up.railway.app`).
4. Pestaña **Variables** → **New Variable**:
   - **Name:** `ANALYTICS_ALLOW_BACKDATE`
   - **Value:** `true`
5. **No** añadir esta variable en catalog, leads, partner ni search (solo analytics).
6. Guardar → Railway redeploya automáticamente (o **Deployments** → **Redeploy** en analytics).

### Paso 2 — Verificar deploy con backdate

Desde tu máquina (repo clonado):

```bash
curl -sS -X POST "https://floitanalytics-service-production.up.railway.app/v1/events" \
  -H "content-type: application/json" \
  -d '{"name":"experiment_assignment","properties":{"experiment":"cta_lead_entrypoint_v2","ctaVariant":"membership","_stagingBackdateDays":5,"venueSlug":"qa-backdate-test"}}'
```

Luego comprobar que existe actividad en un día anterior (no solo hoy):

```bash
curl -sS "https://floitanalytics-service-production.up.railway.app/v1/metrics/experiments/cta-lead-form?windowDays=14" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('stableDays',j.stableDaysWithAllVariants);j.points?.forEach(p=>console.log(p.date,p.membership.assignments,p.trial.assignments,p.whatsapp_first.assignments));});"
```

Si `ANALYTICS_ALLOW_BACKDATE` está activo y el deploy incluye `f937abf`, verás asignaciones repartidas en fechas pasadas tras el seed (paso 3).

### Paso 3 — Seed de tráfico (7 días A/B)

Requisitos locales: `docs/env/staging.local` con `AUTH0_M2M_CLIENT_ID` + `AUTH0_M2M_CLIENT_SECRET` + `AUTH0_DOMAIN` (o `ADMIN_OIDC_ISSUER`).

```bash
cd "/Users/nosoyelmago/Documents/FLOIT v.0.2"
export PATH="$(pwd)/.cursor-bin:$PATH"
pnpm staging:generate-traffic
```

El script publica, por cada variante, **5 `experiment_assignment` por día** en `_stagingBackdateDays` 0…6 (7 días) + submits y leads para SLA.

### Paso 4 — Gate PRD completo

```bash
pnpm sprint5:staging-gate
```

**Éxito esperado:** línea final `Result: PASS (KPI gate for Sprint 5 is green)` y `PASS sprint5:staging-gate completado` — **17/17 checks**.

### Paso 5 — Post-GO (inmediato tras 17/17)

1. En Railway analytics: **eliminar** `ANALYTICS_ALLOW_BACKDATE` o poner `false` → redeploy (evitar backdate en operación normal).
2. Registrar en [`STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md) fecha + commit + salida gate.
3. Firma GO/NO-GO producto/ops → [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md) §14.

---

## Brechas conocidas (actualizado 2026-05-27)

1. **KPI PRD 17/17** — re-seed con `ANALYTICS_ALLOW_BACKDATE` (§ Cierre KPI 17/17); live 2026-08-02 = FAIL por ventana vacía.
2. **Token M2M** — expira ~24 h; renovar con `pnpm auth0:m2m-token` → Vercel Preview `ADMIN_OIDC_ACCESS_TOKEN`.
3. **Firma GO/NO-GO** — producto/ops pendiente tras KPI 17/17.
4. **Prod** — `www.quegym.com`: pendiente post-GO staging.
5. **CI `e2e-services`** — sigue FAIL en `main` (no bloquea staging online).

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

1. ~~`pnpm smoke:platform`~~ — **OK**
2. ~~`pnpm sprint4:gate`~~ — **PASS** (2026-05-27)
3. ~~`pnpm sprint5:flow-checklist`~~ — **PASS** (M2M + `00fd9f9`)
4. **Siguiente:** E2E manual + tráfico CTA → `pnpm sprint5:staging-gate` (KPI sin relaxed)
5. Firma producto/ops en [`STAGING_EVIDENCE_SPRINT4.md`](./STAGING_EVIDENCE_SPRINT4.md) y [`STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md)
6. Checklist visual: [`UI_VISUAL_QA_CHECKLIST.md`](../ux/UI_VISUAL_QA_CHECKLIST.md)

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
- Última ejecución agente: [`STAGING_AGENT_EXECUTION_REPORT.md`](./STAGING_AGENT_EXECUTION_REPORT.md) (2026-05-27)
- Gates staging: `pnpm sprint5:staging-gate -- --kpi-relaxed` (vault `docs/env/staging.local`)
- Login admin staging: `apps/web/src/lib/admin-local-login.ts` (`7554d6c`)

*Actualizado 2026-05-27: auth M2M + fix issuer `00fd9f9`; Sprint 4 PASS; Sprint 5 preflight PASS; KPI A/B FAIL; GO técnico condicional.*
