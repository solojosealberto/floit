# QueGym — estado de épicas e historias implementadas

Recuento consolidado del avance funcional contra `docs/product/BACKLOG.md`, basado en lo documentado y entregado en `docs/operations/sprints.md` (Sprints 0–5 en curso).

Fuente de verdad compartida:

- `docs/operations/sprints.md`
- `docs/operations/EPICS_USER_STORIES_STATUS.md`
- `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

Escala de estado (estandar):

- `Completado`
- `Parcial`
- `Pendiente`
- `Bloqueado`

Equivalencia historica en este documento:

- `Implementada` == `Completado`: cobertura funcional principal entregada.
- `Parcial`: implementación inicial o incompleta respecto a criterios de aceptación completos.
- `Pendiente`: sin implementación funcional relevante en el repositorio.

---

## Epic 1 — Descubrimiento y búsqueda

| User story | Estado | Evidencia principal |
|---|---|---|
| US-1.1 Búsqueda por zona/ubicación | Implementada | `search-service` + `/buscar` lista/mapa |
| US-1.2 Filtros básicos | Implementada | Filtros en querystring y aplicación server-side |
| US-1.3 Vista lista y mapa | Implementada | `/buscar` con lista + `DiscoveryMap` |
| US-1.4 Orden por relevancia | Implementada | `sort=relevance/popularity/distance/price` |

## Epic 2 — Perfil y comparación

| User story | Estado | Evidencia principal |
|---|---|---|
| US-2.1 Perfil detallado | Implementada | `/gyms/[slug]`, datos de catálogo + CTAs |
| US-2.2 Comparador | Implementada | `/comparar` hasta 3 centros (MVP) |
| US-2.3 Badges de valor | Implementada | badges en búsqueda/ficha |
| US-2.4 Favoritos | Implementada | `localStorage` + `/favoritos` |

### Desglose operativo en curso para US-2.1/US-2.4 (ficha `/gyms/[slug]`)

- Activar acciones de cabecera y mobile (`Guardar`, `Compartir`) con comportamiento real.
- Asegurar que cada CTA de la ficha tenga acción funcional y medible.
- Mantener consistencia visual/legibilidad en formularios de contacto y reporte.

## Epic 3 — Contacto y solicitud

| User story | Estado | Evidencia principal |
|---|---|---|
| US-3.1 Solicitud de info/suscripción | Implementada | `POST /v1/leads` + formulario en ficha |
| US-3.2 Contacto directo (WA/llamada/correo) | Implementada | `gym-direct-contact.tsx` |
| US-3.3 Confirmación y seguimiento básico | Implementada | `/lead/confirmacion`, `/lead/estado/[token]` |
| US-3.4 Agendar visita/prueba | Parcial | intent `trial` + preferencia horaria, sin agenda real |
| US-3.5 Estado del lead | Implementada (operación) | estados `received/contacted/closed`, panel admin/partner |

### Plan de ajuste funcional inmediato (ficha mobile-first)

- **US-3.1 / US-3.2:** reforzar comportamiento real de botones y secciones en `/gyms/[slug]`.
- **US-3.3:** garantizar continuidad de navegación hacia confirmación/estado desde CTA principal.
- **Estado:** en ejecución incremental por fases (P0 primero).
- **Actualizado:** `Solicitar información` y `Reportar datos incorrectos` abren modales desde CTAs superiores; WhatsApp vuelve a canal directo del centro (sin modal).

## Epic 4 — Onboarding/autoservicio partner

| User story | Estado | Evidencia principal |
|---|---|---|
| US-4.1 Claim de perfil | Implementada | claim público `/partner/claim` (`claimKind` reclamo vs alta nueva + revisión admin); alta nueva crea stub en catálogo al aprobar (`POST /v1/internal/venues`) antes de ownership+sync; webhook opcional de estado claim + E2E Playwright (`e2e/partner-claim.spec.ts`) |
| US-4.2 Gestión básica de perfil | Implementada | operación oficial venue-scoped: `GET/PUT /v1/partner/me/venues/{venueSlug}/profile` (global deprecated `410`) |
| US-4.3 Gestión de planes/precios | Implementada | operación oficial venue-scoped: `/v1/partner/me/venues/{venueSlug}/plans*` (global deprecated `410`) |
| US-4.4 Recepción de leads | Implementada | operación oficial venue-scoped: `/v1/partner/me/venues/{venueSlug}/leads` y `/v1/partner/me/venues/{venueSlug}/leads/{id}/status`; BFF web usa `/api/partner/me/venues/{venueSlug}/leads/{id}/status` (legacy `/api/partner/me/leads/{id}/status` deprecated `410`) |
| US-4.5 Promociones/ofertas | Implementada (MVP base) | promociones activas en catálogo/ficha |

### Actualización de arquitectura partner (multi-centro)

- `Completado` login partner web por `email + contraseña` (OIDC `grant_type=password`) + sesión HttpOnly; adicionalmente existe modo QA local por credenciales vía env.
- `Completado` selector de centros `/partner/gyms` y entrada de workspace por gym.
- `Completado` hub de centros partner `/partner/venues` con accesos rápidos por centro (dashboard/perfil/planes/leads/configuración) y continuidad del selector legacy (`/partner/gyms` -> redirect).
- `Completado` panel partner operando en contexto de `venueSlug` para operaciones clave, con navegación funcional por secciones (`Dashboard`, `Editar perfil`, `Planes y precios`, `Leads recibidos`, `Configuración`) y acciones de estado de lead desde el panel.
- `Completado` módulo `Configuración` partner en `panel` y rutas dedicadas (`/partner/configuracion/*`) con flujos operativos de cuenta para QA local: consulta de centros por ownership, solicitud de cambio de correo (pendiente de verificación) y eliminación de cuenta en modo demo mediante cierre de sesión controlado.
- `Completado` (2026-05-09) flujo público de alta/reclamo en `/partner/claim`: separación «cuenta existente» vs «sin cuenta», stepper solo tras avanzar del paso inicial, modal de sesión activa cuando hay cookie OIDC/dev-email, y entrada `/partner` con empty state cuando el partner autenticado no tiene centros activos.
- `Completado` (2026-05-27) **Rebrand Fase 2 UI + copy verbal:** tokens QueGym, toggle tema, partner/admin shells, copy venezolano (home hero «Encuentra…», anti-voseo), `pnpm copy:verify`. Ver `docs/ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md` y `docs/ux/QUEGYM_BRAND_COPY_PLAN.md`.
- `Completado` (2026-05-09, misma jornada) pulido UX/copy en `/partner/claim` (título de página, cabecera «Tu centro en QueGym» — rebrand Fase 1 mayo 2026, opciones reclamo vs alta en paralelo, textos por paso) y en `/partner/panel` → Configuración → Cuenta: menú lateral consistente y «Cerrar sesión» junto a «Eliminar cuenta» (`POST /partner/logout`).
- `Completado` (2026-05-09) continuidad claim→acceso: copy explícito de que el **correo del claim** es el de login en `/partner/login`; confirmación enlaza al login; rutas configuración cuenta envueltas en **Suspense** para build estable.
- `Completado` (2026-05) rutas de entrada partner alineadas al login: **`FloitMainHeader`** («¿Eres partner?») y **home** (banner «Reclamar mi centro») → **`/partner/login`**; alta/reclamo público permanece en **`/partner/claim`** (p. ej. desde login «Primera vez»). Panel **`/partner/panel`** incluye retorno rápido al hub **`/partner/venues`** vía **«← Mis centros»**. Referencia de rutas: `docs/operations/WEB_ROUTES_PLATFORM.md`.

## Catálogo — datos operativos Caracas (2026-05-21)

| Ítem | Estado |
|------|--------|
| Import CSV → Postgres | **Implementado** — `scripts/venues-import/`, `pnpm venues:load`, guía `docs/operations/VENUES_CATALOG_IMPORT.md` |
| Volumen MVP piloto PRD (40–70) | **Superado** en local (~95 centros) |
| Seed demo 8 venues | **Retirado de BD** en entorno cargado; código seed sigue en repo solo para BD vacía |
| Calidad post-import | **Parcial** — geocodificación y mapeo `venueType`/zona documentados como deuda en `VENUES_CATALOG_IMPORT.md` |

## Epic 5 — Backoffice y calidad catálogo

| User story | Estado | Evidencia principal |
|---|---|---|
| US-5.1 Alta/edición/moderación admin | Parcial | vistas/admin operativas; moderación avanzada pendiente |
| US-5.2 Taxonomías y atributos | Implementada | tabla `taxonomy_attributes` en catalog; `GET/POST/PATCH /v1/admin/taxonomy-attributes` + `AdminApiGuard`; seed opcional sincroniza slugs desde `venues.modalities`/`amenities`; BFF `apps/web/src/app/api/admin/taxonomy-attributes/*`; UI `/admin/taxonomias` (`taxonomias-client.tsx`) pestañas Modalidad/Amenidad, listado con conteo en gyms, activar/desactivar, crear/editar con slug **únimo global** |
| US-5.3 Gestión de leads backoffice | Implementada | `/admin/leads`: mismo shell que catálogo; tabla con **Ver** → modal de detalle (`LeadDetailModal`): datos del contacto, mensaje, consentimiento, trazabilidad (IP hoy / mismo teléfono), historial, estados (Nuevo/Atendido/Sospechoso/Spam) vía `PATCH /v1/admin/lead/:id`, WhatsApp, nota interna (`adminNote`); API detalle `GET /v1/admin/lead/:id` |
| US-5.4 Duplicados/calidad de datos | Implementada (UI revisión), Parcial (merge) | UI **`/admin/duplicados`** sobre `v1/admin/meta/duplicate-suspects`; fusión automática de venues fuera de MVP |
| US-5.5 Gestión de contenido visual | Implementada (MVP) | UI **`/admin/moderacion-media`**: reportes (`venue_reports` + PATCH estado) y revisión de fotos por centro |

Notas operativas recientes de US-5.1:

- Dashboard/home admin operativo en `/admin` como entrada principal de backoffice; hub **`/admin/configuracion`** para sesión/auth read-only y enlaces operativos (`admin-config-summary.ts`, plan `ADMIN_CONFIGURATION_PAGE_PLAN.md`).
- Login admin local por formulario (`/admin/login`) habilitable por env para QA sin IdP.
- Redirección post-login unificada hacia `/admin` y tolerancia a fallos parciales en dashboard para evitar caída total por un upstream.
- Tabla **`/admin/catalogo`**: acción editar abre **`/admin/catalogo/[venueSlug]/panel`** (misma UI que panel partner; APIs admin en `partner-service` + BFF `/api/admin/catalog/venues/...`). Alta nueva desde admin enlaza a **`/partner/claim?returnTo=/admin/catalogo`**.
- **Alta vía claim partner:** al aprobar en **`/admin/partner-claims`** un claim con `claimKind: new`, `catalog-service` recibe **`POST /v1/internal/venues`** (token `x-internal-token` alineado con `partner-sync`) y crea un stub de venue si el slug aún no existe; luego se activa ownership y la cola partner→catalog. Requiere catalog accesible desde `partner-service` (`CATALOG_SERVICE_URL`, `PARTNER_TO_CATALOG_INTERNAL_TOKEN` / mismo valor que `CATALOG_INTERNAL_API_TOKEN` en catalog).
- **UI admin solicitudes (2026-05-09 / 2026-05-10):** página **`/admin/partner-claims`** con **`partner-claims-dashboard.tsx`**: KPIs, búsqueda, chips, tabla, paginación, **Ver detalle** → **`claim-detail-modal.tsx`** (centro/borrador, solicitante, evidencia, historial, acciones); export CSV; **`GET /v1/admin/partner/claims`** expone **`updatedAt`** por fila. Bloque **`#operaciones-y-sync`**: **`partner-service-health-panel.tsx`**, **`dlq-failures-panel.tsx`** (catalog-sync + outbox: filtros, selección, reintentos vía BFF, modal detalle), **`ownership-partner-venue-panel.tsx`**, **`ownership-audit-panel.tsx`** (CSV, filtros, fecha, paginación; carga audit hasta 200 ítems); **`admin-refresh-button.tsx`**.
- **Validación CI:** el workflow **`e2e-services`** comprueba health de **partner** (`4013`) antes de Playwright; el smoke E2E de home usa los CTAs reales del hero (coherencia `WEB_ROUTES_PLATFORM.md`).

## Epic 6 — Analítica y experimentación

| User story | Estado | Evidencia principal |
|---|---|---|
| US-6.1 Instrumentación del funnel | Implementada | eventos funnel + segmentos + series |
| US-6.2 Dashboard de métricas MVP | Implementada | `/admin/analytics` — KPIs y filtros (24h/7d/30d, dispositivo); gráficos SVG (barras apiladas leads por canal, donut dispositivos, línea ficha vs leads); tablas zona/fuente/top gimnasios; bloque colapsable «Detalle técnico» (funnel por barras, experimento CTA + barras y decisión A/B, donut SLA, serie diaria); contraste explícito para tema claro |
| US-6.3 Experimentos CTA/form | Implementada (fase inicial) | `cta_lead_entrypoint_v2` + gate A/B |
| US-6.4 Encuesta post-lead | Parcial | flujo y evento `lead_survey` base |

Notas operativas recientes de discovery/comparación (US-2.x):

- Comparador `/comparar` rediseñado en formato tabla por secciones (visual y flujo alineados a referencia).
- Estado de comparación persistente (máx. 3 centros) entre `/buscar` y `/comparar` vía `localStorage`.
- Desde `/buscar`, cada centro puede añadirse/quitarse del comparador en lista/mapa/mobile y la barra flotante muestra chips removibles (`×`).
- Desde `/comparar`, el botón `+ Añadir centro` abre modal con búsqueda incremental para incorporar centros sin perder la selección actual.
- Header de navegación Floit unificado en flujo público y eliminación del bloque visual legacy tipo browser en home/buscar.
- `/favoritos` migrada a estilo visual discovery con acciones por ficha: `Comparar/Comparando` (modal contextual) y `Guardado` (deselección/remoción inmediata).
- Home + `/buscar` + `/gyms/[slug]` renderizan fotos reales vía `photoUrls`; catálogo/search exponen esas URLs y quedan persistidas por centro en DB.
- En `/buscar` modo `Mapa` desktop, se oculta la sidebar lateral de filtros y se concentra el control en la barra superior.
- Se compactaron acciones por tarjeta en la lista lateral del mapa para evitar truncado del nombre/información del centro.
- El botón `Filtros` en desktop mapa quedó operativo mediante panel desplegable superior (sin afectar vista lista).
- Ajuste visual de concordancia en tarjetas de mapa desktop: controles `Comparar/Guardar` representados por iconos compactos; `Guardado` activo en negro con estrella blanca; layout lateral/mapa ajustado a 30/70.

## Epic 7 — Confianza, seguridad y cumplimiento

| User story | Estado | Evidencia principal |
|---|---|---|
| US-7.1 Consentimiento y tratamiento | Implementada | `consentAccepted/consentVersion` + `/privacidad` |
| US-7.2 Anti-spam y abuso | Implementada | throttling + IP/suspicious + Turnstile |
| US-7.3 Señalización verificada | Implementada | badges `floit_verified/partner_verified/reference` |
| US-7.4 Reportar info incorrecta | Implementada | `POST /v1/venues/:slug/reports` + UI |

## Epic 8 — Enablers técnicos

| User story | Estado | Evidencia principal |
|---|---|---|
| US-8.1 Responsive mobile-first | Implementada | rutas públicas/partner/admin responsive |
| US-8.2 Performance base | Parcial | optimizaciones base; budget/perf-gate formal pendiente |
| US-8.3 SEO e indexabilidad | Implementada | metadata, sitemap, robots, URLs por gym |
| US-8.4 Roles y permisos | Implementada | OIDC + guards admin/partner + ownership RBAC |

---

## Resumen ejecutivo por estado

- `Implementadas`: 24 historias (incluyendo implementaciones operativas MVP).
- `Parciales`: 9 historias (normalmente por profundidad operativa/UX o alcance extendido).
- `Pendientes`: 0 en nivel “sin señal”, pero varias parciales requieren cierre de producción/ops.

> Nota: este recuento mide cobertura funcional MVP y no implica cierre formal de rollout en staging/prod (pendientes operativos documentados en `docs/operations/sprints.md`).

---

## Rollout staging `staging.quegym.com` (2026-05-27)

| Capacidad | Estado staging | Notas |
|-----------|----------------|-------|
| Discovery (US-1.x) | `Completado` | 95 venues en Neon; search+catalog Railway; Vercel Preview |
| Logotipo header/footer/login | `Completado` | Deploy `ca4070b` en staging; `QueGymLogo` + `/brand/*.png` |
| Ficha / comparar (US-2.x) | `Completado` | `/gyms/*`, `/api/compare/search` verificados en staging |
| Leads públicos (US-3.1) | `Completado` (infra staging) | `leads-service` Railway `/health` 200; admin API con M2M |
| Partner / admin ops (US-4.x, 5.x) | `Parcial` | `/admin/leads` operativo (M2M + `00fd9f9`); E2E manual partner/admin pendiente |
| Analytics / Sprint 5 KPIs (US-6.x) | `Parcial` | Gates **PASS** (2026-06-15); E2E manual y firma GO pendientes |

Evidencia: `STAGING_EVIDENCE_SPRINT5.md`, `STAGING_DEPLOYMENT_STATUS.md`, `STAGING_AGENT_EXECUTION_REPORT.md`.

---

## Rollout staging (histórico 2026-05-26)

---

## Epic UX-V0 — Confianza catálogo y conversión (plan v0 staging)

**Estado:** `Completado en repo` (2026-05-27). Plan: [`docs/ux/QUEGYM_UX_V0_IMPROVEMENT_PLAN.md`](../ux/QUEGYM_UX_V0_IMPROVEMENT_PLAN.md). Fuente: [auditoría v0](https://v0.app/vicsanpar1289/chat/user-experience-improvement-gCH896aJPYE).

| ID backlog | Título | Prioridad | Sprint | Estado |
|------------|--------|-----------|--------|--------|
| UX-V0-101–104 | Fundación `VenueImage`, `VenuePrice`, sanitizar descripción | P0 | UX-A | ✅ |
| UX-V0-201–205 | `/buscar`: tarjetas unificadas, ranking completitud, filtros chip ✕, skeletons | P0–P2 | UX-A / UX-B | ✅ |
| UX-V0-301–306 | `/gyms/[slug]`: galería, logo, sin rating fake, planes/horarios demo + Lucide | P0–P1 | UX-A / UX-C | ✅ (planes demo placeholder) |
| UX-V0-401–404 | Nav móvil, comparar global, FAB mapa, barra flotante + grilla móvil | P0–P2 | UX-B / cierre | ✅ |
| UX-V0-501–504 | Home: stats, cómo funciona, footer | P1–P2 | UX-B | ✅ |
| UX-V0-601–603 | Lucide, skeletons, paridad favoritos/comparar, focus formularios | P1–P2 | UX-C | ✅ |
| UX-V0-701–703 | Pipeline import / completeness score catálogo | P1–P2 | UX-C | ✅ JSON + import Neon staging (95 venues) |
| UX-V0-801+ | Spike “high tech fitness” (opcional) | P2 | Post UX-C | Planificado |

**Entregables comparador (referencia):**

| Pieza | Ruta | Notas |
|-------|------|--------|
| Barra activa en buscar | `compare-active-bar.tsx` | `fixed` fuera de contenedor con `transform`; móvil + desktop |
| Grilla comparación | `compare-grid.tsx` | Sticky labels + headers; scroll H/V en móvil |
| Cliente `/comparar` | `comparar/comparar-client.tsx` | Header móvil «Comparador · N centros»; botón dashed añadir |

| Pieza | Ruta | Notas |
|-------|------|--------|
| Imagen + placeholder | `packages/ui/src/venue-image.tsx` | Siglas centradas; `onError` → placeholder; tokens `--qg-*` (`ff98be2`) |

**Menú móvil (UX-V0-401):**

| Pieza | Ruta | Notas |
|-------|------|--------|
| Drawer header público | `mobile-nav-drawer.tsx` | Portal a `document.body`, `z-[1300]`; panel `bg-quegym-page` opaco; enlaces con `bg-quegym-elevated`; Esc + overlay |
| Trigger | `floit-main-header.tsx` | Botón ☰ solo `md:hidden` |

**Logotipo (2026-06-15, repo local):**

| Pieza | Ruta | Notas |
|-------|------|--------|
| Componente | `quegym-logo.tsx` | Variantes horizontal/symbol; swap light/dark vía `.qg-logo-theme-*` |
| Assets | `brand-assets.ts`, `/brand/*.png` | Deploy staging `ca4070b` |

**Focus formularios (polish UX-C):**

| Pieza | Ruta | Notas |
|-------|------|--------|
| Tokens focus | `apps/web/src/app/globals.css` | Sin outline cuadrado en inputs; `.qg-field:focus-within` sigue `border-radius` |
| Campos UI kit | `packages/ui/src/input.tsx`, `select.tsx` | Borde mint sutil en `:focus-visible` |
| Aplicado en | home, `/buscar`, partner/admin login | Wrappers con clase `qg-field` |

**Próximo paso:** firma GO/NO-GO ops; opcional `ANALYTICS_ALLOW_BACKDATE=true` + re-seed para KPI 17/17.

---

## Foco vigente de ejecución (sprint UI actual)

- **Completado (2026-05-27):** Rebrand Fase 2 visual + copy verbal en repo (`REBRAND_QUEGYM_PLAN.md`, `QUEGYM_BRAND_COPY_PLAN.md`, `pnpm copy:verify`).
- **Completado (2026-05-27):** Sprint **UX-A/B/C** — confianza catálogo y conversión en repo (`QUEGYM_UX_V0_IMPROVEMENT_PLAN.md`): tarjetas unificadas, `/buscar` + ficha + home + shell móvil, Lucide/skeletons, pipeline import re-normalizado (95 venues, 100% descripción limpia en JSON), **comparador** (`CompareActiveBar` + `CompareGrid` móvil), **focus formularios** (`.qg-field` / `.qg-input` en `globals.css`).
- **Completado (2026-06-14):** deploy UX a **staging.quegym.com** (Vercel); import catálogo `{ updated: 95 }`.
- **Completado (2026-06-15):** logotipo QueGym + galería fotos partner + fix CI en repo local (pendiente commit/deploy).
- **Completado (2026-05-27):** menú móvil opaco (`mobile-nav-drawer.tsx` — portal + `bg-quegym-page`).
- **Siguiente línea de trabajo recomendada:** cierre beta staging (QA visual → tráfico KPI A/B → E2E manual §2–3 → firma GO/NO-GO); opcional spike UX-V0-801.
- Scope histórico cerrado: partner planes/fotos, admin duplicados/moderación, taxonomías en buscar, ficha gym tabs/guardar/compartir (ver filas US arriba).
- Fuera del scope MVP transaccional actual: `/checkout`, `/reservas` (solo placeholder/backlog).
