# Instrucciones para agente GPT — Deployment QueGym (staging → GO)

Documento **de arranque** para ChatGPT (Agent Mode, o1, GPT-4 con herramientas) u otro agente con o sin navegador. El detalle paso a paso en UI está en [`AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md`](./AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md).

**No pegar secretos en el chat** (tokens, `DATABASE_URL`, client secrets). Usar el vault del equipo o variables en paneles (Railway / Vercel).

---

## 1. Prompt de sistema (copiar y pegar al iniciar el agente)

```text
Eres un agente de operaciones DevOps para el MVP QueGym (repo floit en GitHub).

Misión: cerrar el paso 3 de staging (catálogo en Neon, APIs estables, smoke/gates, GO/NO-GO)
antes de tocar DNS de producción www.quegym.com.

Lee y sigue en este orden:
1) docs/operations/GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md (este documento)
2) docs/operations/STAGING_DEPLOYMENT_STATUS.md (estado actual)
3) docs/operations/AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md (bloques A→G en UI; H solo tras GO)

Contexto fijo (mayo 2026):
- Web staging: https://staging.quegym.com (200 OK)
- Catalog Railway: https://floitcatalog-service-production.up.railway.app
  - /health → OK
  - /health/ready → falla: relation "venues" does not exist (schema + import pendientes)
- Infra paso 2 hecha: Neon quegym, Railway quegym-api, Vercel floit-web, Auth0, DNS staging
- Repo: https://github.com/solojosealberto/floit rama main

Reglas:
- No commitear ni escribir secretos en git ni en el chat.
- Tras cada bloque, verificar el criterio «Éxito si» antes de continuar.
- No configurar www en GoDaddy hasta decisión GO explícita.
- Si no tienes terminal: pide al usuario comandos marcados 🖥️ TERMINAL y solo el resultado (sin secretos).
- Al finalizar o bloquear, devuelve el informe de la sección 6 de GPT_AGENT_DEPLOYMENT_INSTRUCTIONS.md.
```

---

## 2. Rol y alcance

| Ámbito | Incluido | Excluido |
|--------|----------|----------|
| Staging | Schema Neon catalog, import ~95 venues, URLs Railway en Vercel, pruebas UI, gates | — |
| Producción | Solo preparación documentada | Cutover `www` sin GO |
| Código | Sugerir cambios; no refactorizar fuera de deploy | Rebrand Fase 2+, features producto |

---

## 3. Estado actual (no inventar)

| Ítem | Valor |
|------|--------|
| **Bloqueante principal** | Tabla `venues` ausente en Neon; import no ejecutado |
| **Catalog URL** | `https://floitcatalog-service-production.up.railway.app` |
| **Comandos repo** | `pnpm staging:bootstrap`, `pnpm venues:import:staging` |
| **Env local ops** | Copiar `docs/env/staging.local.example` → `docs/env/staging.local` (gitignored) |
| **Paso 2 cuentas** | Completado — ver [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md) |

---

## 4. Plan de trabajo (orden obligatorio)

### Fase 1 — Catalog + datos (crítico)

**Objetivo:** `GET …/health/ready` → `{"ok":true,"venues":≥1}` (ideal ~95).

**Opción A — Terminal (preferida si el usuario tiene el repo clonado)**

1. Usuario crea `docs/env/staging.local` con `DATABASE_URL` (Neon `catalog`) y `CATALOG_INTERNAL_API_TOKEN` (mismo que Railway catalog).
2. 🖥️ TERMINAL en la raíz del monorepo:

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"   # si aplica
pnpm staging:bootstrap
```

**Opción B — Solo Railway (sin repo local)**

1. Navegador → Railway → servicio **catalog** → `DATABASE_SYNC=true` → **Redeploy**.
2. Verificar `/health/ready` con `venues: 0` o más.
3. Poner `DATABASE_SYNC=false` → redeploy.
4. Usuario ejecuta `pnpm venues:import:staging` con token del vault (opción A paso 2 sin bootstrap de schema).

**Opción C — Neon SQL (solo PostGIS si logs lo piden)**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

**Éxito si:** import sin `failed`; `/buscar` en staging muestra gimnasios tras actualizar Vercel.

---

### Fase 2 — APIs Railway + Vercel

Seguir **BLOQUE B y C** en [`AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md`](./AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md).

**Objetivo:** cinco `/health` OK; Vercel Preview con `CATALOG_*`, `SEARCH_*`, `LEADS_*`, `PARTNER_*`, `ANALYTICS_*` apuntando a `*.up.railway.app`.

**Éxito si:** `https://staging.quegym.com/buscar` lista centros reales.

---

### Fase 3 — Validación y GO

| Paso | Acción |
|------|--------|
| 3.1 | Pruebas UI E1–E10 (runbook bloque E) |
| 3.2 | 🖥️ `SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform` |
| 3.3 | 🖥️ `LEADS_HEALTH_URL=… PARTNER_HEALTH_URL=… pnpm sprint4:gate` |
| 3.4 | 🖥️ `pnpm sprint5:flow-checklist` y `pnpm sprint5:kpi-gate` |
| 3.5 | Rellenar [`STAGING_EVIDENCE_SPRINT4.md`](./STAGING_EVIDENCE_SPRINT4.md) y [`STAGING_EVIDENCE_SPRINT5.md`](./STAGING_EVIDENCE_SPRINT5.md) |
| 3.6 | Decisión **GO** o **NO-GO** |

**Éxito si:** gates PASS o NO-GO documentado con bloqueadores claros.

---

### Fase 4 — Producción (solo tras GO)

Bloque **H** del runbook browser + §14 de [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md).

---

## 5. Comandos de referencia (🖥️ TERMINAL)

Sustituir URLs y **no** pegar tokens en el chat.

```bash
# Health catalog
curl -sS https://floitcatalog-service-production.up.railway.app/health
curl -sS https://floitcatalog-service-production.up.railway.app/health/ready

# Bootstrap + import (requiere docs/env/staging.local)
pnpm staging:bootstrap

# Solo import HTTP a Railway
pnpm venues:import:staging

# Validación datos
pnpm venues:validate:live

# Smoke staging
SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform
```

---

## 6. Informe que debe devolver el agente

Al terminar o al bloquear, responder **solo** con esta plantilla rellena:

```markdown
## Informe agente GPT — Deployment QueGym — <fecha>

### Fase completada hasta
- [ ] 1 Catalog + import (health/ready + venues)
- [ ] 2 Railway URLs + Vercel env
- [ ] 3 Smoke / gates / evidencias
- [ ] 4 Prod (solo si GO)

### Catalog
- /health: 
- /health/ready: 
- Import (resumen): 

### URLs Railway (sin secretos)
- catalog: https://floitcatalog-service-production.up.railway.app
- search: 
- leads: 
- partner: 
- analytics: 

### Staging UI
- /buscar: PASS / FAIL — notas:
- /admin/login: PASS / FAIL
- /partner/login: PASS / FAIL

### Gates (salida resumida, sin tokens)
- smoke:platform: 
- sprint4:gate: 
- sprint5:flow-checklist: 
- sprint5:kpi-gate: 

### Decisión
- **GO** / **NO-GO**
- Bloqueadores:
- Próximo paso humano (una acción concreta):
```

---

## 7. Errores frecuentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Import 401 | Token distinto entre Railway y comando local | Alinear `CATALOG_INTERNAL_API_TOKEN` con vault |
| `venues` does not exist | Sin `DATABASE_SYNC` inicial | Opción B Fase 1 o `pnpm staging:bootstrap` |
| `/buscar` vacío en staging | Vercel sin URLs Railway o catálogo vacío | Fase 2 + Fase 1 |
| Partner login OIDC | Auth0 Password grant deshabilitado | Auth0 → Partner app → Grant Types |
| Admin leads 401 | Falta M2M `ADMIN_OIDC_ACCESS_TOKEN` en Vercel | Renovar token M2M Auth0 |

---

## 8. Documentos relacionados

| Documento | Uso |
|-----------|-----|
| [`AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md`](./AGENT_BROWSER_DEPLOYMENT_RUNBOOK.md) | Pasos detallados en Railway, Vercel, Auth0, GoDaddy |
| [`STAGING_DEPLOYMENT_STATUS.md`](./STAGING_DEPLOYMENT_STATUS.md) | Inventario infra ya configurada |
| [`PRODUCTION_ACCOUNTS_SETUP.md`](./PRODUCTION_ACCOUNTS_SETUP.md) | Variables por servicio |
| [`PRODUCTION_LAUNCH_PLAN.md`](./PRODUCTION_LAUNCH_PLAN.md) | Cutover prod |
| [`VENUES_CATALOG_IMPORT.md`](./VENUES_CATALOG_IMPORT.md) | Pipeline CSV |
| [`docs/env/staging.local.example`](../env/staging.local.example) | Plantilla env ops local |

---

*Última actualización: 2026-05-25 — paso 2 cerrado; bloqueante: schema + import catalog en Neon.*
