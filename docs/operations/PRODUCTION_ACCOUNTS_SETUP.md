# Paso 2 — Alta de cuentas e infraestructura (QueGym)

Guía ejecutable para crear cuentas según decisiones **D1–D6** ([`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md) §16). Orden recomendado: **Neon → Railway → Auth0 → Vercel → GoDaddy DNS**.

Plantilla de variables (sin secretos): [`docs/env/production.example`](../env/production.example).

---

## Checklist maestro

> **Estado (2026-05):** pasos 0–7 **completados** según [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md). Pendientes: **8–9** y GO staging.

| # | Tarea | Hecho |
|---|--------|-------|
| 0 | Generar tokens S2S (`openssl rand -hex 32`) | ✅ |
| 1 | Cuenta **Neon** + 4 databases + PostGIS | ✅ |
| 2 | Cuenta **Railway** + proyecto + 5 servicios | ✅ |
| 3 | Cuenta **Auth0** + apps Partner + M2M Admin API | ✅ |
| 4 | Cuenta **Vercel** + proyecto monorepo | ✅ |
| 5 | **GoDaddy** DNS `staging` (+ TTL bajo antes de prod) | ✅ |
| 6 | Variables en Vercel + Railway (sin commitear) | ✅ |
| 7 | Web staging `https://staging.quegym.com` responde | ✅ |
| 8 | Import catálogo en Neon staging | ☐ |
| 9 | Smoke + gates + evidencias Sprint 4/5 | ☐ |

---

## 0. Tokens S2S (generar una vez)

En una terminal segura, genera **un valor distinto** por token:

```bash
openssl rand -hex 32   # repetir para cada fila
```

| Variable | Usada en |
|----------|----------|
| `CATALOG_INTERNAL_API_TOKEN` | catalog, import `venues:import`, partner→catalog |
| `PARTNER_TO_CATALOG_INTERNAL_TOKEN` | partner-service (mismo valor que catalog internal) |
| `LEADS_INTERNAL_API_TOKEN` | leads-service |
| `PARTNER_TO_LEADS_INTERNAL_TOKEN` | partner-service (mismo valor que leads internal) |
| `ADMIN_API_TOKEN` | solo **staging** si admin UI aún sin OIDC browser (ver §4) |

Guardar en vault (1Password / Doppler). **No** subir a git.

---

## 1. Neon (D3 + D6)

### 1.1 Crear proyecto

1. [https://console.neon.tech](https://console.neon.tech) → **New Project** → nombre `quegym`.
2. Región: **US East** o la más cercana a usuarios (LATAM: evaluar latencia; `us-east-1` suele ser aceptable para MVP).
3. Postgres **16**.

### 1.2 Cuatro bases de datos

En el mismo proyecto Neon, crea **4 databases** (o branches si prefieres aislar staging):

| Database | Servicio |
|----------|----------|
| `catalog` | catalog-service (PostGIS) |
| `partner` | partner-service |
| `leads` | leads-service |
| `analytics` | analytics-service |

**Staging vs prod:** opción A — proyecto Neon `quegym-staging` + `quegym-prod`; opción B — branch `staging` / `main` en un proyecto (Neon branching).

### 1.3 PostGIS en `catalog`

En la consola SQL de la database `catalog`, ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### 1.4 Connection strings

Copiar cada connection string con **SSL** (`?sslmode=require`). Formato:

```text
postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

Renombrar database en la URL: `/catalog`, `/partner`, `/leads`, `/analytics`.

Anotar:

- `DATABASE_URL_CATALOG`
- `DATABASE_URL_PARTNER`
- `DATABASE_URL_LEADS`
- `DATABASE_URL_ANALYTICS`

### 1.5 Primera migración catalog (staging)

Variables locales temporales:

```bash
export DATABASE_URL="<DATABASE_URL_CATALOG>"
export DATABASE_SYNC=true
export SEED_ON_BOOT=false
export CATALOG_INTERNAL_API_TOKEN="<tu token>"
```

Arrancar catalog local apuntando a Neon **solo la primera vez** para crear tablas, luego:

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
pnpm venues:normalize -- --skip-geocode
CATALOG_SERVICE_URL=<url publica o tunnel catalog> \
CATALOG_INTERNAL_API_TOKEN=<token> \
pnpm venues:import
```

En Railway (siguiente sección) fijar `DATABASE_SYNC=false` tras el primer arranque exitoso.

---

## 2. Railway (D2)

### 2.1 Proyecto

1. [https://railway.app](https://railway.app) → **New Project** → `quegym-api`.
2. **Connect Repo** → GitHub `floit` (monorepo).
3. Activar **Private Networking** entre servicios del proyecto.

### 2.2 Cinco servicios (mismo repo)

Crear **5 servicios** vacíos y configurar cada uno:

| Servicio Railway | Package pnpm | Puerto |
|------------------|--------------|--------|
| `catalog` | `@floit/catalog-service` | 4010 |
| `search` | `@floit/search-service` | 4011 |
| `leads` | `@floit/leads-service` | 4012 |
| `partner` | `@floit/partner-service` | 4013 |
| `analytics` | `@floit/analytics-service` | 4014 |

**Settings comunes (cada servicio):**

| Campo | Valor |
|-------|--------|
| Root Directory | `/` (raíz del monorepo) |
| Build Command | `pnpm install --frozen-lockfile && pnpm --filter @floit/<service> build` |
| Start Command | `pnpm --filter @floit/<service> start` |
| Watch Paths | `services/<name>/**`, `packages/**` |

Reemplaza `<service>` por `catalog-service`, `search-service`, etc.

**Variables de entorno** — pegar desde [`production.example`](../env/production.example) por servicio.

**Networking:**

- Anotar URL **privada** de cada servicio (Railway internal DNS), p. ej. `catalog.railway.internal:4010` o variable `${{catalog.RAILWAY_PRIVATE_DOMAIN}}` según UI.
- **No** exponer públicamente los 5 servicios si Vercel es el único cliente (recomendado).

**Orden de arranque:** catalog → search, leads, partner, analytics (search depende de catalog).

### 2.3 Variables críticas por servicio

**catalog**

```env
NODE_ENV=production
PORT=4010
DATABASE_URL=<DATABASE_URL_CATALOG>
DATABASE_SYNC=false
SEED_ON_BOOT=false
CATALOG_INTERNAL_API_TOKEN=<token>
```

**search**

```env
NODE_ENV=production
PORT=4011
CATALOG_SERVICE_URL=http://<catalog-private-host>:4010
```

**leads**

```env
NODE_ENV=production
PORT=4012
DATABASE_URL=<DATABASE_URL_LEADS>
DATABASE_SYNC=true
ADMIN_AUTH_REQUIRE_OIDC=true
ADMIN_OIDC_ISSUER=https://<tenant>.auth0.com/
ADMIN_OIDC_AUDIENCE=floit-admin
LEADS_INTERNAL_API_TOKEN=<token>
ANALYTICS_SERVICE_URL=http://<analytics-private-host>:4014
```

**partner**

> **Deploy Railway:** (1) **`express`** como dependencia directa (`main.ts` sirve `/uploads`). (2) Con **`DATABASE_URL`** (Neon `/partner`), las entidades usan **`timestamptz`** — no `datetime` (SQLite); ver `services/partner/src/typeorm-column-types.ts`. Sin esto, TypeORM falla al inicializar metadata en PostgreSQL.

```env
NODE_ENV=production
PORT=4013
HOST=0.0.0.0
DATABASE_URL=<DATABASE_URL_PARTNER>
DATABASE_SYNC=true
CATALOG_SERVICE_URL=http://<catalog-private-host>:4010
PARTNER_TO_CATALOG_INTERNAL_TOKEN=<token>
PARTNER_TO_LEADS_INTERNAL_TOKEN=<token>
ADMIN_AUTH_REQUIRE_OIDC=true
PARTNER_AUTH_REQUIRE_OIDC=true
ADMIN_OIDC_ISSUER=...
PARTNER_OIDC_ISSUER=...
ADMIN_OIDC_AUDIENCE=floit-admin
PARTNER_OIDC_AUDIENCE=floit-partner
```

**analytics**

```env
NODE_ENV=production
PORT=4014
DATABASE_URL=<DATABASE_URL_ANALYTICS>
DATABASE_SYNC=true
```

### 2.4 Health check

Tras deploy, desde tu máquina (o Railway shell):

```bash
curl -s https://<catalog-public-o-solo-via-tunnel>/health
```

Ideal: validar solo vía red privada desde un job temporal; en staging puede exponer **un** servicio para debug y cerrarlo después.

---

## 3. Auth0 (D4)

### 3.1 Tenant

1. [https://manage.auth0.com](https://manage.auth0.com) → crear tenant, p. ej. `quegym-prod` (usar `quegym-staging` para pruebas si Auth0 lo permite).
2. Región US (coherente con Neon/Railway US).

Anotar **Issuer URL**: `https://<tenant>.us.auth0.com/` (o dominio custom más adelante).

### 3.2 API (audiences legacy)

**Applications → APIs → Create API**

| Campo | Admin | Partner |
|-------|-------|---------|
| Name | QueGym Admin API | QueGym Partner API |
| Identifier | `floit-admin` | `floit-partner` |
| Signing | RS256 | RS256 |

Los servicios Nest validan JWT con `ADMIN_OIDC_AUDIENCE` / `PARTNER_OIDC_AUDIENCE` = estos identifiers (legacy `floit-*` hasta rebrand Fase 3).

### 3.3 App Partner (login correo/contraseña)

**Applications → Create Application**

| Campo | Valor |
|-------|--------|
| Name | QueGym Partner Web |
| Type | **Regular Web Application** |
| Callback URLs | `https://staging.quegym.com/partner/auth/callback`, `https://www.quegym.com/partner/auth/callback` |
| Allowed Logout URLs | mismos orígenes |
| Allowed Web Origins | `https://staging.quegym.com`, `https://www.quegym.com` |

**Settings → Advanced → Grant Types:**

- Habilitar **Password** (Resource Owner Password) — requerido por el login actual en `partner/auth/login` (grant `password`).
- Habilitar **Authorization Code** — para flujo `/partner/auth/callback` si se usa en el futuro.

**Nota seguridad:** ROPG está deprecado en OAuth2; para MVP staging es aceptable; planificar migración a Universal Login + Authorization Code.

Anotar **Client ID** y **Client Secret** → Vercel `PARTNER_OIDC_*`.

### 3.4 App M2M Admin (BFF → APIs)

**Create Application → Machine to Machine**

| Campo | Valor |
|-------|--------|
| Name | QueGym Admin BFF |
| Authorize | APIs `floit-admin` (y scopes si aplica) |

Anotar Client ID/Secret. Obtener token de prueba en **Test** tab o:

```bash
curl -s --request POST \
  --url "https://<tenant>.us.auth0.com/oauth/token" \
  --header 'content-type: application/json' \
  --data '{
    "client_id":"<M2M_CLIENT_ID>",
    "client_secret":"<M2M_SECRET>",
    "audience":"floit-admin",
    "grant_type":"client_credentials"
  }'
```

Ese `access_token` es el valor inicial de **`ADMIN_OIDC_ACCESS_TOKEN`** en Vercel (servidor) para que el BFF admin llame a leads/partner/catalog.

### 3.5 Usuarios

| Rol | Cómo |
|-----|------|
| Partner de prueba | **User Management** → Create user → email + password; probar login en `/partner/login` |
| Admin humano | Mismo tenant; para **UI admin** hoy el código usa formulario local — en **staging** ver §3.6 |

### 3.6 Admin UI (estado actual del código)

- **BFF admin** hacia microservicios: usa `ADMIN_OIDC_ACCESS_TOKEN` (M2M) o `x-admin-token` si no strict.
- **Pantalla `/admin/login`:** formulario local → `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD` solo si `NODE_ENV !== production'`.

**Staging recomendado (hasta OIDC browser admin):**

```env
# Vercel staging
ADMIN_AUTH_REQUIRE_OIDC=false
ADMIN_API_TOKEN=<token fuerte>
ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD=true
ADMIN_LOCAL_LOGIN_EMAIL=ops@quegym.com
ADMIN_LOCAL_LOGIN_PASSWORD=<solo staging>
```

**Producción (objetivo):** `ADMIN_AUTH_REQUIRE_OIDC=true`, sin passwords locales; implementar flujo OIDC admin en web o usar IdP + M2M solo para APIs y restringir admin UI por IP/Vercel SSO.

### 3.7 Partner strict en staging

```env
PARTNER_AUTH_REQUIRE_OIDC=true
PARTNER_OIDC_ISSUER=https://<tenant>.us.auth0.com/
PARTNER_OIDC_AUDIENCE=floit-partner
PARTNER_OIDC_CLIENT_ID=<partner app client id>
PARTNER_OIDC_CLIENT_SECRET=<secret>
PARTNER_OIDC_SCOPE=openid email profile
```

Validar: `pnpm sprint4:gate` con URLs Railway públicas temporales o túnel.

---

## 4. Vercel (D1)

### 4.1 Proyecto

1. [https://vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub.
2. **Framework:** Next.js.
3. **Root Directory:** `apps/web` (importante en monorepo).
4. **Install Command** (override en Project Settings → Build):

```bash
cd ../.. && pnpm install --frozen-lockfile
```

5. **Build Command:**

```bash
cd ../.. && pnpm --filter @floit/web build
```

6. **Node.js Version:** 20.x

### 4.2 Entornos

| Entorno | Branch | Dominio |
|---------|--------|---------|
| Production | `main` | `www.quegym.com` |
| Preview / Staging | `main` o branch `staging` | `staging.quegym.com` |

### 4.3 Variables (Production)

Copiar bloque **Vercel** de [`production.example`](../env/production.example).

Sustituir URLs de servicios por variables **Railway**:

- Opción A: URLs privadas si Vercel soporta integración Railway (Private Link / public egress).
- Opción B (MVP): exponer en Railway **solo** con autenticación por red allowlist Vercel IPs (menos ideal).
- Opción C: un **reverse proxy** único en Railway para APIs (futuro).

**MVP pragmático staging:** generar dominio público Railway por servicio (`*.up.railway.app`) y restringir con token; Vercel server-side llama por HTTPS. Rotar a private networking en hardening.

Ejemplo:

```env
NEXT_PUBLIC_SITE_URL=https://staging.quegym.com
CATALOG_SERVICE_URL=https://catalog-production-xxxx.up.railway.app
SEARCH_SERVICE_URL=https://search-production-xxxx.up.railway.app
LEADS_SERVICE_URL=https://leads-production-xxxx.up.railway.app
PARTNER_SERVICE_URL=https://partner-production-xxxx.up.railway.app
ANALYTICS_SERVICE_URL=https://analytics-production-xxxx.up.railway.app
```

### 4.4 Dominios en Vercel

**Project → Settings → Domains**

| Dominio | Entorno |
|---------|---------|
| `staging.quegym.com` | Preview o Production (staging branch) |
| `www.quegym.com` | Production |

### 4.5 Verificación

Tras deploy:

```bash
curl -sI https://staging.quegym.com | head -5
SMOKE_WEB_BASE=https://staging.quegym.com node scripts/smoke-platform.mjs
```

---

## 5. GoDaddy DNS (D5)

### 5.1 Acceso

1. [https://dcc.godaddy.com](https://dcc.godaddy.com) → dominio **quegym.com**.
2. Activar **2FA** en la cuenta.
3. **DNS → Manage DNS**.

### 5.2 Registros staging (primero)

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME | `staging` | `cname.vercel-dns.com` (copiar de Vercel → Domains → staging) | 600 |

Esperar propagación (5–30 min). Probar `https://staging.quegym.com`.

### 5.3 Registros producción (después de GO staging)

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | `www` | target Vercel producción |
| Forwarding | `@` | `https://www.quegym.com` (301 permanente) |

### 5.4 Antes del cutover prod

- Bajar TTL a **600** s 48 h antes.
- No apuntar `www` a prod hasta checklist §14 de [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md).

---

## 6. Validación integrada staging

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"

# Health (sustituir URLs Railway)
pnpm smoke:local   # o curl manual a cada /health

# Plataforma
SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform

# OIDC gates (URLs públicas leads/partner)
LEADS_HEALTH_URL=https://<leads>/health \
PARTNER_HEALTH_URL=https://<partner>/health \
pnpm sprint4:gate

# E2E (opcional)
E2E_WITH_SERVICES=1 pnpm test:e2e
```

Registrar resultados en [`STAGING_EVIDENCE_SPRINT4.md`](./STAGING_EVIDENCE_SPRINT4.md) y [`STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md).

---

## 7. Problemas frecuentes

| Síntoma | Causa | Acción |
|---------|--------|--------|
| `/buscar` vacío | Catálogo sin import o URL search mal | `venues:import`, revisar `CATALOG_SERVICE_URL` en Vercel |
| Partner login `oidc_password_grant_not_enabled` | Auth0 sin grant Password | Habilitar Password en app Partner |
| Admin 401 en leads | Falta `ADMIN_OIDC_ACCESS_TOKEN` o audience | M2M token + `floit-admin` |
| Catalog error PostGIS | Extensión no creada | SQL §1.3 |
| Railway build falla | Root directory incorrecto | Build desde raíz monorepo con `--filter` |
| Vercel no encuentra workspace | Install sin pnpm en raíz | Install command `cd ../.. && pnpm install` |

---

## 8. Siguiente paso (paso 3)

Paso 2 cerrado — ver detalle en [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md).

1. **Import catálogo** (`pnpm venues:import` → catalog Railway/Neon).
2. **Fijar URLs** de microservicios en Vercel y validar `/health`.
3. **Smoke + gates** contra `https://staging.quegym.com` y APIs Railway.
4. **Evidencias** Sprint 4/5 + decisión **GO/NO-GO**.
5. Solo tras GO: DNS prod `www` y cutover §14 de [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md).

Referencias: [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md), [`oidc-rollout-sprint4.md`](./oidc-rollout-sprint4.md), [`VENUES_CATALOG_IMPORT.md`](./VENUES_CATALOG_IMPORT.md).
