# Runbook para agente (ChatGPT Agent Mode / navegador) — Cierre deployment QueGym

## Prompt inicial (copiar en ChatGPT Agent Mode)

```text
Eres un agente de operaciones. Sigue al pie de la letra el runbook del repositorio floit:
docs/operations/AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md (bloques A→G en orden; bloque H solo si GO).

Contexto: staging https://staging.quegym.com ya existe; catalog Railway
https://floitcatalog-service-production.up.railway.app devuelve 502.
Proyectos: Railway quegym-api, Vercel floit-web, Neon quegym, Auth0, GoDaddy quegym.com.

Reglas: no commitear ni pegar secretos en el chat; usa vault del usuario para tokens;
tras cada bloque verifica el criterio «Éxito si»; al final rellena la plantilla §3 Informe.
Si necesitas terminal, pide al usuario ejecutar comandos marcados 🖥️ TERMINAL.
```

Instrucciones ejecutables para un **agente con navegador** que complete el deployment de staging y prepare producción. Diseñado para **ChatGPT Agent Mode** (o equivalente): cada bloque tiene objetivo, pasos en UI, criterio de éxito y qué hacer si falla.

**No pegar secretos en chats ni en capturas.** Usar vault (1Password / gestor del equipo) para tokens y connection strings.

---

## 0. Contexto fijo (no inventar valores)

| Concepto | Valor |
|----------|--------|
| Repo GitHub | `https://github.com/solojosealberto/floit` |
| Rama | `main` |
| Web staging | `https://staging.quegym.com` |
| Web prod (futuro) | `https://www.quegym.com` |
| Vercel proyecto | `floit-web` (root `apps/web`) |
| Railway proyecto | `quegym-api` |
| Neon proyecto | `quegym` (región `us-east-1`) |
| Auth0 audiences | `floit-admin`, `floit-partner` |
| Catalog Railway (URL conocida) | `https://floitcatalog-service-production.up.railway.app` |
| GoDaddy dominio | `quegym.com` |
| CNAME staging actual | `staging` → `df46f0c75f1e085a.vercel-dns-017.com` |

**Problema abierto (2026-05-25):** catalog `/health` **OK**; pendiente **import** (token vault, no `change-me-dev-only`) y URLs de search/leads/partner/analytics en Vercel.

**Fix en código (ya en `main`):** servicios Nest escuchan en `0.0.0.0` (`HOST`). Requiere **redeploy** en Railway.

**Estado paso 2 (cuentas):** completado — ver [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md).

---

## 1. Reglas del agente

1. **Orden:** no saltar bloques; no configurar `www` en GoDaddy hasta **GO staging** (bloque 8).
2. **Verificar** después de cada bloque (tabla «Éxito si»).
3. **Logs Railway** si un servicio no arranca: copiar las últimas 30 líneas del deploy fallido al informe final.
4. **Terminal:** si el agente no tiene terminal, pedir al usuario que ejecute los comandos del bloque marcados con `🖥️ TERMINAL` y pegar solo el resultado (sin secretos).
5. **Parar y escalar** si tras 2 redeploys catalog sigue en 502 sin error claro en logs.

---

## 2. Accesos necesarios (abrir sesión antes de empezar)

Abrir en pestañas y confirmar login:

| # | URL | Para qué |
|---|-----|----------|
| 1 | https://railway.app/dashboard | Proyecto `quegym-api`, redeploy, logs, dominios públicos |
| 2 | https://vercel.com/dashboard | Proyecto `floit-web`, env, dominios |
| 3 | https://console.neon.tech | Proyecto `quegym`, SQL `catalog` (solo si hace falta PostGIS) |
| 4 | https://manage.auth0.com | Apps Partner + M2M Admin, grants |
| 5 | https://dcc.godaddy.com/control/dnsmanagement?domainName=quegym.com | DNS (solo lectura hasta bloque 8) |
| 6 | https://staging.quegym.com | Validación UI |

Vault del equipo: debe contener `CATALOG_INTERNAL_API_TOKEN`, `LEADS_INTERNAL_API_TOKEN`, `DATABASE_URL` (×4), Auth0 client secrets, `ADMIN_API_TOKEN` (staging).

---

## BLOQUE A — Reparar catalog Railway (502) 🔴 CRÍTICO

### Objetivo

`GET https://floitcatalog-service-production.up.railway.app/health` → `{"ok":true,"service":"catalog"}`.

### Pasos en navegador (Railway)

1. Ir a **Railway** → proyecto **`quegym-api`**.
2. Abrir servicio **catalog** (nombre puede ser `catalog` o `floit-catalog-service-production`).
3. Pestaña **Settings** → confirmar:
   - **Root Directory:** `/` (raíz del monorepo).
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm --filter @floit/catalog-service build`
   - **Start Command:** `pnpm --filter @floit/catalog-service start`
4. Pestaña **Variables** — comprobar que existen (valores desde vault, no copiar al chat):

   | Variable | Debe estar |
   |----------|------------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4010` (o dejar que Railway inyecte `PORT`) |
   | `HOST` | `0.0.0.0` (añadir si falta) |
   | `DATABASE_URL` | connection string Neon **database `catalog`** con `?sslmode=require` |
   | `DATABASE_SYNC` | `false` (si tablas ya existen; `true` solo primera vez) |
   | `SEED_ON_BOOT` | `false` |
   | `CATALOG_INTERNAL_API_TOKEN` | token del vault |

5. Si `DATABASE_URL` falta o está vacío → pegar desde Neon (proyecto `quegym` → database `catalog` → **Connection string**).
6. Pestaña **Deployments** → **Redeploy** (o **Deploy** desde último commit de `main` en GitHub).
7. Esperar estado **Success** (verde). Si **Failed**, abrir **View logs** y anotar error.

### Verificación (agente o usuario en terminal)

🖥️ **TERMINAL:**

```bash
curl -sS https://floitcatalog-service-production.up.railway.app/health
```

**Éxito si:** respuesta JSON con `"ok":true` y `"service":"catalog"`.

### Si sigue 502

| Error en logs | Acción en navegador |
|---------------|---------------------|
| `DATABASE_URL is required` | Añadir `DATABASE_URL` en Variables y redeploy |
| `connection refused` / `timeout` a Neon | Revisar connection string, IP allow en Neon, `sslmode=require` |
| `relation "venues" does not exist` | Poner `DATABASE_SYNC=true`, redeploy una vez, luego volver a `false` y redeploy |
| `postgis` / extension | Neon → SQL Editor en DB `catalog` → ejecutar `CREATE EXTENSION IF NOT EXISTS postgis;` |
| Build failed | Corregir build command; verificar repo conectado a `main` |
| Sin error claro | Redeploy los **5** servicios; repetir curl |

### Neon (solo si logs piden PostGIS)

1. https://console.neon.tech → proyecto **`quegym`** → database **`catalog`** → **SQL Editor**.
2. Ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

---

## BLOQUE B — Salud de los 5 microservicios + URLs públicas

### Objetivo

Cada servicio en **Success** y URL pública `*.up.railway.app` anotada para Vercel.

### Pasos en navegador (Railway)

Para cada servicio: **catalog**, **search**, **leads**, **partner**, **analytics**:

1. Abrir servicio → **Settings** → añadir `HOST=0.0.0.0` si falta.
2. **Deployments** → si no está en Success tras bloque A, **Redeploy**.
3. **Settings** → **Networking** → **Generate Domain** (o anotar dominio público existente).
4. Anotar URL base (sin `/health` al final), ejemplo:

| Servicio | Variable Vercel | URL anotada (rellenar) |
|----------|-----------------|-------------------------|
| catalog | `CATALOG_SERVICE_URL` | `https://floitcatalog-service-production.up.railway.app` |
| search | `SEARCH_SERVICE_URL` | `https://________________.up.railway.app` |
| leads | `LEADS_SERVICE_URL` | `https://________________.up.railway.app` |
| partner | `PARTNER_SERVICE_URL` | `https://________________.up.railway.app` |
| analytics | `ANALYTICS_SERVICE_URL` | `https://________________.up.railway.app` |

5. **search** → Variables: `CATALOG_SERVICE_URL` = URL **privada** de catalog si Railway la muestra (ej. `http://catalog.railway.internal:4010`) **o** URL pública de catalog si no hay private networking entre servicios.
6. **partner** → confirmar `PARTNER_TO_CATALOG_INTERNAL_TOKEN` = mismo valor que `CATALOG_INTERNAL_API_TOKEN` en catalog.
7. **leads** → confirmar `LEADS_INTERNAL_API_TOKEN` y `ANALYTICS_SERVICE_URL`.

### Verificación

🖥️ **TERMINAL** (sustituir URLs anotadas):

```bash
curl -sS https://<CATALOG_URL>/health
curl -sS https://<SEARCH_URL>/health
curl -sS https://<LEADS_URL>/health
curl -sS https://<PARTNER_URL>/health
curl -sS https://<ANALYTICS_URL>/health
```

**Éxito si:** los cinco devuelven JSON con `"ok":true` (o equivalente por servicio).

---

## BLOQUE C — Actualizar Vercel (BFF staging)

### Objetivo

`staging.quegym.com` llama a las APIs Railway correctas.

### Pasos en navegador (Vercel)

1. https://vercel.com → proyecto **`floit-web`**.
2. **Settings** → **Environment Variables**.
3. Entorno **Preview** (y/o el entorno ligado a `staging.quegym.com`) — actualizar:

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://staging.quegym.com` |
| `CATALOG_SERVICE_URL` | URL catalog del bloque B |
| `SEARCH_SERVICE_URL` | URL search |
| `LEADS_SERVICE_URL` | URL leads |
| `PARTNER_SERVICE_URL` | URL partner |
| `ANALYTICS_SERVICE_URL` | URL analytics |
| `ADMIN_AUTH_REQUIRE_OIDC` | `false` |
| `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD` | `true` (solo staging) |
| `ADMIN_API_TOKEN` | desde vault (staging) |
| `ADMIN_OIDC_ACCESS_TOKEN` | token M2M Auth0 (renovar si expiró) |
| `ADMIN_OIDC_ISSUER` | `https://<tenant>.us.auth0.com/` |
| `ADMIN_OIDC_AUDIENCE` | `floit-admin` |
| `PARTNER_AUTH_REQUIRE_OIDC` | `true` |
| `PARTNER_OIDC_ISSUER` | mismo tenant Auth0 |
| `PARTNER_OIDC_AUDIENCE` | `floit-partner` |
| `PARTNER_OIDC_CLIENT_ID` / `PARTNER_OIDC_CLIENT_SECRET` | app Partner Web |
| `PARTNER_OIDC_REDIRECT_URI` | `https://staging.quegym.com/partner/auth/callback` |

4. **Deployments** → último deployment → **⋯** → **Redeploy** (para aplicar env).

### Verificación en navegador

1. Abrir https://staging.quegym.com → debe cargar home (200).
2. Abrir https://staging.quegym.com/buscar → tras bloque D debe listar gimnasios (no vacío).

---

## BLOQUE D — Importar catálogo (~95 venues) en Neon

### Objetivo

Base `catalog` en Neon con venues importados.

### Prerrequisito

Bloque A: health catalog **OK**.

### Pasos 🖥️ TERMINAL (usuario o agente con repo clonado)

En máquina con repo `floit` y Node 20 + pnpm:

```bash
cd /ruta/al/repo/floit
export PATH="$(pwd)/.cursor-bin:$PATH"   # si aplica

export CATALOG_SERVICE_URL=https://floitcatalog-service-production.up.railway.app
export CATALOG_INTERNAL_API_TOKEN=<PEGAR_DESDE_VAULT_SIN_COMPARTIR_EN_CHAT>

pnpm venues:import:staging
pnpm venues:validate:live
```

**Éxito si:** resumen import sin `failed`; validate live OK; en logs algo como `created` / `updated` (~95).

### Verificación en navegador

1. https://staging.quegym.com/buscar — tarjetas de gimnasios visibles.
2. Abrir una ficha `/gyms/<slug>` — datos y sin error 500.

### Si import falla 401

- Token en Railway (catalog) ≠ token en comando → alinear con vault y redeploy catalog.

### Si import falla 502

- Volver al **BLOQUE A**.

---

## BLOQUE E — Pruebas funcionales en navegador (staging)

Ejecutar y anotar PASS/FAIL:

| # | URL / acción | Éxito si |
|---|----------------|----------|
| E1 | https://staging.quegym.com | Home QueGym carga |
| E2 | /buscar | Lista + mapa con venues |
| E3 | /gyms/&lt;slug-real&gt; | Ficha carga, CTA visibles |
| E4 | /comparar | Comparador carga (puede estar vacío) |
| E5 | Formulario lead en ficha → enviar | Redirección confirmación o mensaje éxito |
| E6 | https://staging.quegym.com/admin/login | Login admin (credenciales staging del vault) |
| E7 | /admin | Dashboard admin tras login |
| E8 | /admin/leads | Tabla leads (puede estar vacía) |
| E9 | https://staging.quegym.com/partner/login | Pantalla login partner |
| E10 | Login partner Auth0 (usuario de prueba en Auth0) | Entra a /partner/venues o panel |

Si E6–E10 fallan por 401: revisar `ADMIN_OIDC_ACCESS_TOKEN` / M2M en Vercel (bloque C) y Auth0.

---

## BLOQUE F — Gates técnicos (terminal)

🖥️ **TERMINAL** en repo, con URLs del bloque B:

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform

export LEADS_HEALTH_URL=https://<LEADS_URL>/health
export PARTNER_HEALTH_URL=https://<PARTNER_URL>/health
pnpm sprint4:gate

pnpm sprint5:flow-checklist
pnpm sprint5:kpi-gate
```

**Éxito si:** scripts terminan con exit code 0 / PASS documentado.

Si `sprint4:gate` o Sprint 5 fallan por **401 SLA**: configurar auth admin (M2M token en Vercel) y repetir.

---

## BLOQUE G — Evidencias y GO/NO-GO

### Objetivo

Decisión formal antes de producción.

### Pasos (repo o navegador + editor)

1. Abrir en GitHub o editor local:
   - `docs/operations/STAGING_EVIDENCE_SPRINT4.md`
   - `docs/operations/STAGING_EVIDENCE_SPRINT5.md`
2. Rellenar: fecha, URLs, resultado bloques A–F, capturas (sin secretos).
3. Marcar decisión: **GO** o **NO-GO**.

**GO** solo si: catalog health OK, import OK, `/buscar` con datos, smoke platform PASS, gates acordados PASS o excepciones documentadas.

Actualizar `docs/operations/STAGING_DEPLOYMENT_STATUS.md` checklist ítems 7–8 a ✅.

---

## BLOQUE H — Producción `www.quegym.com` (SOLO si GO)

⚠️ **No ejecutar** si bloque G = NO-GO.

### H1 — Vercel Production

1. Proyecto `floit-web` → **Settings** → **Domains** → añadir `www.quegym.com` → Production.
2. **Environment Variables** → entorno **Production**:
   - `NEXT_PUBLIC_SITE_URL=https://www.quegym.com`
   - Mismas URLs Railway (o Neon prod si hay proyecto separado).
   - `ADMIN_AUTH_REQUIRE_OIDC=true`
   - `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD=false`
   - `PARTNER_AUTH_REQUIRE_OIDC=true`
   - Sin passwords locales en prod.

### H2 — GoDaddy DNS

1. https://dcc.godaddy.com → `quegym.com` → **DNS**.
2. Añadir CNAME **`www`** → target que indique Vercel para Production.
3. **Forwarding** registro **`@`** → `https://www.quegym.com` (301).
4. TTL **600** s.

### H3 — Import catálogo prod

Si Neon prod es branch/DB separado: repetir **BLOQUE D** con `CATALOG_SERVICE_URL` de catalog prod.

### H4 — Verificación final

- https://www.quegym.com
- Checklist §14 en [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md)

---

## 3. Informe final que debe devolver el agente

Al terminar (o al bloquear), responder con esta plantilla:

```markdown
## Informe deployment QueGym — <fecha>

### Bloque completado hasta
- [ ] A Catalog health
- [ ] B 5× health
- [ ] C Vercel env
- [ ] D Import catálogo
- [ ] E UI staging
- [ ] F Gates
- [ ] G GO/NO-GO
- [ ] H Prod

### URLs Railway anotadas
- catalog: 
- search: 
- leads: 
- partner: 
- analytics: 

### Health catalog
- Comando: curl .../health
- Resultado: 

### Import catálogo
- Resumen pnpm venues:import:staging: 

### Staging UI
- /buscar: PASS/FAIL
- admin login: PASS/FAIL
- partner login: PASS/FAIL

### Gates
- smoke:platform: 
- sprint4:gate: 
- sprint5: 

### Decisión
- GO / NO-GO
- Bloqueadores: 
- Próximo paso humano: 
```

---

## 4. Referencias internas

| Documento | Uso |
|-----------|-----|
| [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md) | Estado actual infra |
| [`PRODUCTION_ACCOUNTS_SETUP.md`](./PRODUCTION_ACCOUNTS_SETUP.md) | Detalle variables por servicio |
| [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md) | Cutover prod §14 |
| [`VENUES_CATALOG_IMPORT.md`](./VENUES_CATALOG_IMPORT.md) | Pipeline CSV → catalog |
| [`docs/env/production.example`](../env/production.example) | Lista de variables |

---

*Última actualización: 2026-05-25 — catalog Railway 502 pendiente; fix `0.0.0.0` en `main`.*
