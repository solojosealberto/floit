# Reporte QA — Portal Admin en staging

**Fecha:** 2026-08-02  
**Entorno:** https://staging.quegym.com  
**Método:** login admin local + pruebas HTTP de páginas, BFF (`/api/admin/*`) y APIs Railway (partner / leads / catalog) con token M2M Auth0 fresco.  
**Artefacto JSON:** [`ADMIN_STAGING_QA_REPORT.json`](./ADMIN_STAGING_QA_REPORT.json)  
**Estado vivo del producto:** [`NEXT_AGENT_BRIEF.md`](./NEXT_AGENT_BRIEF.md)

---

## 1) Veredicto ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Puede un admin iniciar sesión? | **Sí** (`POST /admin/auth/login` → 303 + cookie) |
| ¿Cargan las pantallas del admin? | **Sí** (HTTP 200) — varias muestran error de datos |
| ¿Funciona editar perfil / planes / fotos / portada? | **No** — partner admin API responde **500** tras auth OIDC válida |
| ¿Se persisten cambios en el catálogo público? | **No** — no hay escritura exitosa desde admin |
| ¿Coincide con el reporte del usuario? | **Sí** — banner/portada, planes, borrados y guardado fallan por backend partner |

**Severidad:** bloqueante para operación admin de centros en staging.

---

## 2) Alcance probado (como administrador)

### 2.1 Autenticación y shells

| Prueba | Resultado | Notas |
|--------|-----------|--------|
| Login local admin | **PASS** | Cookie `floit_admin_email` |
| `/admin` | **PASS** | 200 |
| `/admin/catalogo` | **PASS** | Lista 95 venues (lectura catalog pública) |
| `/admin/catalogo/life-fit-zone/panel` | **PASS página / FAIL datos** | Shell 200; APIs de edición 500 |
| `/admin/leads` | **FAIL datos** | «No se pudo cargar…» (BFF→leads 401) |
| `/admin/partner-claims` | **FAIL datos** | «No se pudo cargar claims…» (partner 500) |
| `/admin/taxonomias` | **FAIL APIs** | Catalog admin `401 admin_not_configured` |
| `/admin/moderacion-media` | **FAIL APIs** | Misma causa catalog |
| `/admin/duplicados` | **FAIL APIs** | Misma causa catalog |
| `/admin/analytics` | **PASS** | 200 (analytics público/métricas) |
| `/admin/configuracion` | **PASS** | 200 read-only |

### 2.2 Edición de centro (`life-fit-zone`) — lo que el usuario reportó

| Función esperada | UI | API | Resultado |
|------------------|----|-----|-----------|
| Cambiar foto / **portada** (banner) | Panel Fotos → Portada | `PATCH …/photos/{id}/cover` + upload | **FAIL** partner/BFF **500** |
| Cambiar **planes** | Panel Planes | `GET/POST/PATCH …/plans` | **FAIL** **500** |
| **Eliminar** foto | Panel Fotos | `DELETE …/photos/{id}` | **FAIL** **500** (no se pudo listar ni subir) |
| Guardar perfil / descripción | Panel perfil | `PUT …/profile` | **FAIL** **500** |
| Ver reflejo en ficha pública | `/gyms/life-fit-zone` | catalog `GET /v1/venues/:slug` | Sin marker de prueba (no hubo save) |

**Nota de producto:** no existe campo «banner» aparte. La portada es la foto cover (`sortOrder` 0 / `PATCH …/cover`). Horarios/modalidades/amenidades del panel son en buena parte **UI placeholder**, no APIs de venue.

### 2.3 Otras operaciones admin

| Función | Resultado | Causa |
|---------|-----------|--------|
| Crear claim público | **PASS** | `POST /v1/partner/claims` → **201** (DB partner escribe) |
| Listar/aprobar claims (admin) | **FAIL** | `GET/POST …/admin/partner/claims*` → **500** |
| Ownerships / DLQ sync | **FAIL** | **500** |
| Listar leads (API directa M2M) | **PASS** | `GET /v1/admin/leads` 200 |
| Listar leads (vía web/BFF) | **FAIL** | 401 upstream — token Vercel |
| Taxonomías / reportes / media-review | **FAIL** | Catalog sin OIDC/`ADMIN_API_TOKEN` → `admin_not_configured` |

### 2.4 Resumen cuantitativo (suite automatizada)

Del JSON de corrida: **16 PASS / 22 FAIL / 38 total**.

Fallos concentrados en: partner admin CRUD, BFF catalog auth, BFF leads auth.

---

## 3) Hallazgos raíz (prioridad)

### H1 — partner-service: APIs admin devuelven 500 (P0)

**Estado (2026-08-03):** **Fix en código** — pendiente **redeploy Railway partner** + re-verificación.  
**Causa raíz confirmada:** `AdminApiGuard` construía la JWKS URL con `new URL(...)` **fuera** del `try/catch`. Si `ADMIN_OIDC_ISSUER` (o JWKS) viene como host sin `https://`, Node lanza `Invalid URL` → Nest **500**. Evidencia: Bearer inválido también daba **500** (no 401); leads con el mismo M2M → 200/401. Los handlers admin **no llegaban a ejecutarse**.

**Remedio en repo:** `services/partner/src/oidc-jose.ts` (normaliza issuer/JWKS) + guards admin/partner con validación OIDC dentro de `try/catch`. Env: `ADMIN_OIDC_ISSUER=https://<tenant>.us.auth0.com`.

**Síntoma (pre-fix, 2026-08-02):** Con Bearer M2M (`aud=floit-admin`):

- sin token → **401** `missing_bearer_token`
- con token (válido o inválido) → **500** en:
  - `/v1/admin/catalog/venues/:slug/profile|plans|photos`
  - `/v1/admin/partner/claims` / `ownerships` / `catalog-sync/*`

**Contraste:** `POST /v1/partner/claims` (público) → **201**. Health partner → **200**, colas `failed=0`.

**Impacto usuario:** «no guarda», «no cambia planes», «no cambia foto», «no elimina» — el panel llama a estas APIs y recibe 500.

### H2 — Vercel BFF: auth admin hacia leads/catalog inconsistente (P0)

`getAdminAuthHeader()` en web:

1. Si existe `ADMIN_OIDC_ACCESS_TOKEN` → siempre Bearer (aunque esté expirado).
2. Si no, `ADMIN_API_TOKEN` + sesión local.

| Upstream | Comportamiento observado |
|----------|--------------------------|
| **leads** | M2M fresco directo **OK**; BFF staging **401** → token en Vercel ausente/expirado/inválido |
| **catalog** admin | M2M fresco → **401 `admin_not_configured`** → Railway catalog **sin** `ADMIN_OIDC_ISSUER` y sin `ADMIN_API_TOKEN` |
| **partner** | Pre-fix: M2M → **500** (H1). Post-fix código: redeploy + re-probe |

**Impacto:** leads, taxonomías, moderación media, duplicados y reportes no operan desde el portal aunque el login UI sea correcto.

### H3 — Limitaciones de producto (no bugs, pero confunden QA)

| Expectativa | Realidad en código |
|-------------|-------------------|
| Eliminar centro | **No hay** DELETE de venue en admin |
| Eliminar plan | Solo desactivar (`active: false`), no hard delete |
| Banner dedicado | Solo **portada** de galería |
| Editar nombre/zona/modalidades del CSV | No van por sync partner→catalog (sync: description, contactos, photos, plans, allowsTrial) |
| Pestañas Borradores/Archivados | No son ciclo de vida real |

---

## 4) Matriz de funciones (admin)

| Área | Lectura UI | Escritura | Persistencia pública | Estado |
|------|------------|-----------|----------------------|--------|
| Login | OK | — | — | OK |
| Catálogo listado | OK | Alta vía claim | Claim create OK; approve FAIL | Parcial |
| Panel centro perfil | Roto (500) | Roto | No | **Roto** |
| Planes | Roto | Roto | No | **Roto** |
| Fotos / portada | Roto | Roto | No | **Roto** |
| Eliminar foto | Roto | Roto | No | **Roto** |
| Leads | Error carga | No probado UI | API M2M OK | **Parcial** |
| Claims / ownership / DLQ | Error carga | Approve 500 | — | **Roto** |
| Taxonomías | UI carga | API 401 | — | **Roto** |
| Moderación media / reportes | UI carga | API 401 | — | **Roto** |
| Duplicados | UI carga | Solo dismiss local | Sin merge | **Parcial** |
| Analytics | OK | — | — | OK |
| Configuración | OK read-only | — | — | OK |

---

## 5) Plan de remediación recomendado (ops + ingeniería)

### Inmediato (desbloqueo staging)

1. **Railway → partner:** redeploy con `main` (fix H1). Asegurar `ADMIN_OIDC_ISSUER=https://…` (URL absoluta). Probe: bad Bearer → **401**; good M2M `GET /v1/admin/partner/claims?limit=1` → **200**.
2. Confirmar `ADMIN_CATALOG_DELEGATE_EMAIL` en partner (email del admin local) para venues sin ownership — evita 422 tras arreglar el 500.
3. **Vercel Preview:** renovar `ADMIN_OIDC_ACCESS_TOKEN` (`pnpm auth0:m2m-token`) y redeploy.
4. **Railway → catalog:** set `ADMIN_OIDC_ISSUER` (+ audience/JWKS) alineado a Auth0 `floit-admin`, **o** `ADMIN_API_TOKEN` coherente con Vercel si se usa legacy.

### Verificación post-fix (re-correr esta suite)

```bash
export PATH="$(pwd)/.cursor-bin:$PATH"
# re-ejecutar probes: profile GET/PUT, plans, photos cover/delete, claims list, leads BFF, taxonomy
pnpm sprint5:staging-gate -- --kpi-relaxed  # no sustituye QA admin
```

Criterios de done:

- [ ] `GET/PUT` profile admin 200  
- [ ] `GET/POST/PATCH` plans 200  
- [ ] upload + cover + delete photo 200  
- [ ] claims list 200; approve 200  
- [ ] BFF `/api/admin/leads` 200  
- [ ] taxonomy-attributes 200  
- [ ] Cambio visible en `GET /v1/venues/{slug}` tras sync (pocos segundos)  

---

## 6) Respuesta directa a los síntomas del usuario

| Queja | Diagnóstico |
|-------|-------------|
| No puedo cambiar foto del banner | Portada = cover; API photos/cover **500** (partner) |
| No puedo cambiar planes | API plans **500** |
| No puedo eliminar cosas mal | Photos DELETE **500**; planes solo soft-off; venues no se borran |
| Los cambios no se guardan | PUT profile **500**; además sync a catalog nunca se dispara |

No es un problema de «caché del navegador» ni de DNS `www.staging`. El login y el listado de catálogo engañan: la UI abre, pero la capa de escritura está caída.

---

## 7) Evidencia de corrida (extracto)

```
PASS health partner/catalog/leads
PASS auth.m2m + auth.admin_login
PASS pages /admin, /catalogo, panel, …
FAIL partner/BFF profile|plans|photos → 500
FAIL catalog taxonomy/media → 401 admin_not_configured
FAIL BFF leads → 401
PASS leads M2M directo → 200
PASS POST partner claim → 201
FAIL GET admin claims → 500
```

---

*Generado en QA staging 2026-08-02. H1 remedio en código 2026-08-03 (redeploy pendiente). Actualizar checkboxes tras re-ejecutar la suite post-deploy.*
