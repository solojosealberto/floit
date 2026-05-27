# Plan y diseño — página de configuración admin (`/admin/configuracion`)

Documento de planificación y diseño UX para la sección de **configuración del administrador** en el backoffice web. Se basa en el inventario de rutas (`WEB_ROUTES_PLATFORM.md`), el handover (`PROJECT_CONTEXT_HANDOVER.md`), variables de entorno (`docs/env/local.example`), el runbook OIDC (`oidc-rollout-sprint4.md`), credenciales locales (`LOCAL_TEST_CREDENTIALS.md`) y el código actual (`admin-auth-header.ts`, `admin-session.ts`, `admin-sidebar.tsx`).

## 1. Problema actual

- En `admin-sidebar.tsx`, el ítem **«Configuración»** (`id: settings`) apunta a **`/admin`**, igual que **«Dashboard»**. Duplica la entrada y no hay una vista dedicada a **contexto operativo del admin** (auth, entorno, enlaces a runbooks).
- El dashboard (`/admin`) ya muestra KPIs y accesos rápidos; mezclar ahí «configuración» dispersa la responsabilidad.
- El hub partner **`/partner/configuracion`** existe como patrón de «atajos de configuración» (`partner/configuracion/page.tsx`); el admin no tiene equivalente.

## 2. Objetivos del producto

1. **Un solo lugar** donde el operador entienda **cómo está autenticado el BFF admin**, sin exponer secretos.
2. **Visibilidad read-only** del modo de auth y flags críticos alineados con documentación (OIDC estricto vs fallback, login local solo dev).
3. **Enlaces canónicos** a documentación operativa (runbooks, credenciales de prueba, guía de localhost).
4. **Coherencia de navegación**: Dashboard → `/admin`; Configuración → `/admin/configuracion`.

## 3. Alcance funcional (qué debe incluir)

### 3.1 Identidad y sesión (web)

| Requisito | Fuente | Comportamiento propuesto |
|-----------|--------|---------------------------|
| Mostrar correo de sesión cuando exista cookie HttpOnly | `admin-session.ts` (`floit_admin_email`) | Texto: «Sesión local: …» solo si hay email en sesión (flujo `/admin/login` con `ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD`). |
| No confundir con identidad OIDC del IdP | `PROJECT_CONTEXT_HANDOVER` | Si solo hay `ADMIN_OIDC_ACCESS_TOKEN` en servidor (sin login por formulario), indicar que la identidad humana **no** viene de sesión web sino del token inyectado en el runtime (operación típica CI/staging). |
| Cerrar sesión | Sidebar + `logout/route.ts` | Mantener en sidebar; en la página, opcionalmente repetir enlace a **`/admin/logout`** para consistencia con partner hub. |

### 3.2 Modo de autenticación hacia APIs admin (resumen no sensible)

La lógica real está en `getAdminAuthHeader()`:

1. Si hay **`ADMIN_OIDC_ACCESS_TOKEN`** → cabecera `Authorization: Bearer …` (no mostrar el token).
2. Si **`ADMIN_AUTH_REQUIRE_OIDC=true`** y no hay token OIDC → sin header (fallo esperado).
3. Si no OIDC: **`ADMIN_API_TOKEN`** con **`x-admin-token`**, con subcondición en dev: login local debe coincidir con **`ADMIN_LOCAL_LOGIN_EMAIL`** y sesión.

**UI:** indicadores booleanos derivados solo de **presencia** de variables y flags (sí/no), más una etiqueta legible del «modo efectivo»:

- «Bearer OIDC (token en servidor)»
- «Token legacy (`x-admin-token`)»
- «Login local + token legacy (solo desarrollo)»
- «No configurado» / «OIDC estricto sin token»

Nunca mostrar valores de `ADMIN_API_TOKEN`, `ADMIN_OIDC_ACCESS_TOKEN` ni contraseñas.

### 3.3 Alineación con servicios upstream

Documentación (`local.example`, handover) exige que **web y servicios** compartan criterio admin:

- **Catalog:** taxonomías admin, tokens alineados.
- **Leads / Partner:** `ADMIN_AUTH_REQUIRE_OIDC`, JWKS, audience.

La página puede incluir un bloque **«Checklist de despliegue»** (texto estático) que resume variables por servicio, con enlaces a:

- `docs/operations/oidc-rollout-sprint4.md`
- `docs/env/local.example` (fragmento admin)

Opcional **fase 2:** peticiones `GET /health` a URLs configuradas (`LEADS_SERVICE_URL`, `PARTNER_SERVICE_URL`, …) mostrando solo **HTTP OK / error** (sin cuerpo sensible), para coincidir con la mentalidad de `#operaciones-y-sync` en partner-claims sin duplicar todo el dashboard operativo.

### 3.4 Documentación y runbooks (enlaces)

| Documento | Uso en la pantalla |
|-----------|-------------------|
| `docs/operations/LOCAL_TEST_CREDENTIALS.md` | Bloque «Pruebas locales» — recordatorio de `/admin/login`, taxonomías, leads, claims (sin copiar contraseñas en producción; en prod ocultar o mostrar solo «ver documentación en repositorio»). |
| `docs/operations/LOCALHOST_LINKS_GUIDE.md` | Enlaces BFF y flujos (`ADMIN_CATALOG_DELEGATE_EMAIL`, etc.). |
| `docs/operations/oidc-rollout-sprint4.md` | Transición a OIDC-only, rollback. |
| `WEB_ROUTES_PLATFORM.md` | Mapa de rutas admin para el operador. |

**Nota:** En despliegue real no hay filesystem del repo; los enlaces pueden ser:

- **MVP:** texto con rutas relativas al repo («Clonar y abrir …») para desarrolladores.
- **Opcional:** `NEXT_PUBLIC_DOCS_BASE_URL` apuntando a GitHub/raw o portal interno.

### 3.5 Fuera de alcance (explícito)

- Editar variables de entorno desde la UI.
- CRUD de usuarios administradores (no hay modelo en MVP).
- Rotación de secretos o integración con vault.
- Sustituir **`/admin/partner-claims#operaciones-y-sync`** (health/DLQ detallado permanece allí; aquí solo resumen o enlace).

## 4. Diseño UX (wireframe lógico)

**Layout:** Misma rejilla que el resto del admin: `min-h-screen bg-[#f7f9fc]`, sidebar `AdminSidebar` con **`active="settings"`**, área principal `rounded-2xl border bg-white`.

**Secciones (orden sugerido):**

1. **Cabecera:** título «Configuración» + subtítulo «Entorno del backoffice y autenticación del BFF».
2. **Tarjeta «Sesión»:** email de cookie si existe; si no, mensaje «Sin sesión por formulario (token solo en servidor)».
3. **Tarjeta «Autenticación hacia APIs»:** chips o lista del modo efectivo; filas sí/no para: token OIDC presente, strict OIDC, token legacy presente, login local habilitado (`isAdminLocalPasswordLoginEnabled()` — local o staging Vercel, ver `admin-local-login.ts`).
4. **Tarjeta «Documentación»:** lista de enlaces (runbook OIDC, credenciales locales, rutas web, guía localhost).
5. **Tarjeta «Accesos»:** enlaces internos: Dashboard, Catálogo, Taxonomías, Leads, Solicitudes, Métricas (duplica utilidad del sidebar pero refuerza el rol de «hub» como en partner).
6. **Pie:** recordatorio «Los secretos no se muestran aquí» + enlace **Cerrar sesión**.

**Estados sin auth:** Igual que otras páginas admin: si `getAdminAuthHeader()` es null y no aplica login local, reutilizar el patrón del dashboard (mensaje de configuración de `ADMIN_OIDC_ACCESS_TOKEN` / `ADMIN_API_TOKEN`) o redirigir a `/admin/login` cuando `isAdminLocalPasswordLoginEnabled()` sea true.

## 5. Requisitos técnicos

| ID | Requisito |
|----|-----------|
| R-T1 | Página **Server Component** por defecto; flags derivados de `process.env` solo en servidor. |
| R-T2 | No registrar en logs ni en HTML valores de tokens. |
| R-T3 | **robots:** `noindex, nofollow` (como `/admin/page.tsx`). |
| R-T4 | Tras implementar, actualizar **`WEB_ROUTES_PLATFORM.md`**, **`PROJECT_CONTEXT_HANDOVER.md`**, **`sprints.md`**, **`EPICS_USER_STORIES_STATUS.md`** según regla de AGENTS.md. |
| R-T5 | Corregir **`admin-sidebar.tsx`**: `settings` → `href: "/admin/configuracion"`; marcar activo `settings` en la nueva ruta (y decidir si `/admin` solo activa `dashboard`). |

### URL y naming

- Ruta canónica: **`/admin/configuracion`** (sin tilde en path, alineado con `/partner/configuracion`).
- Opcional: `middleware` o `redirect` desde `/admin/settings` → `/admin/configuracion` si se desea nombre inglés.

## 6. Plan de implementación por fases

| Fase | Entrega |
|------|---------|
| **Fase 1** | Crear `apps/web/src/app/admin/configuracion/page.tsx`; helper opcional `lib/admin-config-summary.ts` para derivar etiquetas desde env + sesión; ajustar sidebar; actualizar docs operativos + `WEB_ROUTES_PLATFORM.md`. |
| **Fase 2** | Health opcional de servicios (solo estado); feature flag env `ADMIN_CONFIG_SHOW_HEALTH=true`. |
| **Fase 3** | Si en el futuro el admin usa flujo OIDC interactivo (no solo token estático), ampliar esta página con «último login» o enlaces al IdP — **fuera del estado actual del código** (hoy el documento de rollout asume token server-side). |

## 7. Criterios de aceptación

- [x] «Configuración» en la barra lateral **no** apunta al mismo URL que «Dashboard» (enlaza a **`/admin/configuracion`**).
- [x] Con usuario autenticado, se ve el modo de auth **sin** secretos.
- [x] En dev con login local, se muestra el email de sesión cuando corresponde.
- [x] Enlaces a documentación operativa presentes y coherentes con `docs/index.md`.
- [ ] Sin regresión en E2E/admin smoke documentados en handover (validación manual/CI según entorno).

## 8. Traza con epics / backlog

- Encaja como **mejora UX admin / operación**, no como nuevo bounded context.
- Si existe historia en `EPICS_USER_STORIES_STATUS.md` sobre «admin settings» o «cierre OIDC», referenciar esta página como superficie de **visibilidad** para operadores durante rollout (`oidc-rollout-sprint4.md`).

---

**Última revisión:** alineado con `PROJECT_CONTEXT_HANDOVER.md` (admin OIDC, login local QA, dashboard `/admin`, taxonomías, claims, analytics) y `WEB_ROUTES_PLATFORM.md` (inventario rutas admin).

**Implementación (2026-05):** página en `apps/web/src/app/admin/configuracion/page.tsx`, helper `apps/web/src/lib/admin-config-summary.ts`, sidebar actualizado en `apps/web/src/app/admin/admin-sidebar.tsx`. Documentación operativa sincronizada en `PROJECT_CONTEXT_HANDOVER.md`, `sprints.md`, `EPICS_USER_STORIES_STATUS.md`, `WEB_ROUTES_PLATFORM.md`, `LOCALHOST_LINKS_GUIDE.md`, `CHANGELOG.md`.
