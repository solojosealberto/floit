# Floit — plan de implementacion UI/UX desde "Floit Wireframe v.0.2"

Plan de migracion de interfaces del proyecto de wireframes al proyecto productivo (`apps/web`), sin romper flujo MVP ni instrumentacion.

## 1) Resultado del analisis de la carpeta de wireframes

Se revisaron:

- Documentacion: `README.md`, `INDEX.md`, `DESIGN_SYSTEM.md`, `COMPONENTS_GUIDE.md`, `WIREFRAME_AUDIT_REPORT.md`.
- Biblioteca UI: `src/floit-ui/*` (tokens + componentes base).
- Pantallas funcionales:
  - Usuario: `src/app/pages/sections/*`
  - Partner: `src/app/pages/partner-sections/*`
  - Admin: `src/app/pages/admin-sections/*`
  - Release 2: `src/app/pages/release2-sections/*`

Hallazgos clave:

- El paquete wireframe ya trae tokens completos (`floit-ui.css`) y set de componentes reutilizables.
- La cobertura visual es mayor que el alcance MVP actual (incluye modulos R2 y algunos futuros).
- El proyecto productivo (`apps/web`) tiene 14 pantallas reales, por lo que la implementacion debe mapear wireframe -> rutas existentes.

### Criterio visual transversal aprobado (todas las pantallas)

- El estilo objetivo de plataforma se toma de Home (`/`) y Buscar (`/buscar`) en **tema claro**.
- Se declara como criterio de migración: evitar variantes oscuras en vistas productivas y en componentes base usados por esas vistas.
- Criterios mínimos de legibilidad:
  - textos de títulos/labels en `text-neutral-800/900`,
  - campos de formulario en `bg-white` con borde neutral y texto oscuro,
  - contraste suficiente en CTA primarios/secundarios.
- Este criterio aplica a usuario, partner y admin, incluyendo formularios de captura/reporte.

## 2) Mapa de interfaces (wireframe -> Floit actual)

### Usuario final (MVP core)

- `HomeScreens.tsx` -> `apps/web/src/app/page.tsx` (landing) y base visual de `apps/web/src/app/buscar/page.tsx`.
- `ResultsScreens.tsx` + `MapScreens.tsx` -> `apps/web/src/app/buscar/buscar-client.tsx` y `apps/web/src/app/buscar/discovery-map.tsx`.
- `DetailScreens.tsx` -> `apps/web/src/app/gyms/[slug]/page.tsx`.
- `ComparatorScreens.tsx` -> `apps/web/src/app/comparar/page.tsx`.
- `FormAndConfirmScreens.tsx` -> `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx`, `apps/web/src/app/lead/confirmacion/page.tsx`.
- `ContactStatesScreens.tsx` -> estados en `/buscar`, `/comparar`, `/gyms/[slug]`, `/lead/estado/[token]`.
- Favoritos (R2) -> `apps/web/src/app/favoritos/page.tsx`.

### Partner panel

- `LoginClaimScreens.tsx` -> `apps/web/src/app/partner/claim/page.tsx`.
- `DashboardScreens.tsx` -> `apps/web/src/app/partner/panel/page.tsx`.
- `ProfileEditScreens.tsx` -> `apps/web/src/app/partner/panel/page.tsx` (seccion perfil).
- `PlansLeadsScreens.tsx` -> `apps/web/src/app/partner/panel/page.tsx` + `apps/web/src/app/partner/leads/page.tsx`.
- `PartnerStatesScreens.tsx` -> estados vacios/error/loading en rutas partner.

### Admin/backoffice

- `AdminDashboardScreens.tsx` -> `apps/web/src/app/admin/analytics/page.tsx` (metricas) y `apps/web/src/app/admin/leads/page.tsx` (operacion).
- `CatalogScreens.tsx` -> referencia para futura UI admin de catalogo (hoy no hay pagina dedicada en `apps/web`).
- `TaxonomyLeadsScreens.tsx` -> `apps/web/src/app/admin/leads/page.tsx`.
- `MetricsRolesScreens.tsx` -> `apps/web/src/app/admin/analytics/page.tsx` y futura vista roles.
- `ComplianceStatesScreens.tsx` -> estados y patrones de error para admin.

### Release 2 (adoptar solo lo que ya existe en producto)

- `RelevanceBadgesScreens.tsx` -> refinamiento visual de `/buscar` y badges en `/gyms/[slug]`.
- `FavoritesLeadScreens.tsx` -> `/favoritos`, `/lead/estado/[token]`.
- `PromotionsQualityScreens.tsx` -> promos/calidad en `/gyms/[slug]`, `/admin/partner-claims`, `/admin/leads`.
- `ExperimentsSEOScreens.tsx` -> `/admin/analytics`, `/buscar` y metadata/SEO existentes.

## 3) Plan de implementacion por fases

## Fase 0 — Baseline y guardrails (2-3 dias)

- Congelar baseline funcional y visual del flujo `buscar -> ficha -> comparar -> lead`.
- Ejecutar y dejar evidencia:
  - `pnpm test:e2e`
  - `pnpm test:capability`
- Crear:
  - `docs/ux/FIGMA_TAXONOMY_MAPPING.md`
  - `docs/ux/FIGMA_SCREEN_INVENTORY.md`
- Exigir referencia visual explícita por tarea:
  - imagen adjunta por producto/usuario o frame Figma equivalente,
  - definición de alcance por ruta (`/ruta`) y viewport (desktop/mobile),
  - checklist visual obligatorio en `docs/ux/UI_VISUAL_QA_CHECKLIST.md`.
- Validar alineación de cada ajuste con:
  - `docs/product/PLAN_MAESTRO.md`,
  - `docs/product/PLAN_PROMPT_ENGINEERING.md`,
  - `docs/product/PRD.md`,
  - `docs/product/BACKLOG.md`.

Salida esperada:

- Taxonomia aprobada.
- Inventario de pantallas priorizado por impacto de negocio.

## Fase 1 — Fundacion de design system en repo productivo (4-6 dias)

Objetivo: llevar tokens y primitives del wireframe al monorepo productivo.

Archivos objetivo:

- `packages/ui/src/`:
  - `tokens.ts` (nuevo)
  - `button.tsx`, `input.tsx`, `badge.tsx`, `card.tsx`, `table.tsx`, `empty-state.tsx`, `banner.tsx` (nuevos)
  - `index.tsx` (actualizar exports)
- `apps/web/src/app/globals.css`:
  - incorporar variables semanticas inspiradas en `src/floit-ui/tokens/floit-ui.css`
- `apps/web/tailwind.config.ts`:
  - mapear colores/tokens semanticos para evitar hardcodeo por pantalla.

Salida esperada:

- Base visual unica para todo `apps/web`.
- Sin duplicacion de estilos ad-hoc en rutas.

## Fase 2 — Interfaces de usuario MVP core (1 semana)

1. Discovery y resultados:
   - `apps/web/src/app/buscar/page.tsx`
   - `apps/web/src/app/buscar/buscar-client.tsx`
   - `apps/web/src/app/buscar/discovery-map.tsx`
2. Ficha:
   - `apps/web/src/app/gyms/[slug]/page.tsx`
   - `apps/web/src/app/gyms/[slug]/gym-direct-contact.tsx`
3. Lead:
   - `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx`
   - `apps/web/src/app/lead/confirmacion/page.tsx`
   - `apps/web/src/app/lead/estado/[token]/page.tsx`
4. Continuidad:
   - `apps/web/src/app/comparar/page.tsx`
   - `apps/web/src/app/favoritos/page.tsx`

Reglas de no regresion:

- No cambiar payloads ni nombres funcionales de campos.
- Conservar eventos de tracking (`discovery_view`, `filter_apply`, `compare_open`, `cta_click`, `lead_submit`).
- Mantener Turnstile y consentimiento intactos.

Avance ejecutado hoy (estado real):

- Home desktop alineada a wireframe con bloques funcionales (buscador, quick zones, categorias, destacados, banner partner).
- Home conectada a datos reales de `search-service` (`/v1/meta/zones`, `/v1/search?sort=popularity`).
- Acciones rápidas en destacados (`Guardar`/`Comparar`) y contador de favoritos en header.
- `/buscar` rediseñada en desktop con shell, toolbar, sidebar de filtros y modo lista/mapa.
- `/buscar` rediseñada mobile-first con filtros compactos desplegables, lista optimizada y estados vacíos.
- Vista mapa mobile con overlays + mini bottom-sheet de resultados.
- Vista mapa desktop con listado lateral + mapa principal + tarjeta destacada.
- Marcadores del mapa corregidos (icono custom visible) y comportamiento de tap/click basado en selección activa (sin popup legacy): tarjeta contextual única.
- Refinamiento interacción mapa `/buscar`:
  - click en ficha de listado (desktop/mobile) enfoca + hace zoom automático al centro seleccionado,
  - click en mapa vacío limpia selección activa,
  - tarjeta contextual anclada al marcador con offset lateral derecho para mantener visible el pin,
  - corrección de glitch visual de posicionamiento (render condicionado a coordenadas válidas + callbacks estables).
- Ficha `/gyms/[slug]` rediseñada para alinearse al wireframe de detalle:
  - breadcrumb superior,
  - bloque visual de galería principal,
  - panel lateral sticky con CTAs (`Solicitar información`, WhatsApp, llamar, email, comparar),
  - bloques de amenidades, planes, horarios y ubicación,
  - continuidad del flujo funcional existente de contacto/reporte (sin romper tracking ni contratos).

## Fase 3 — Interfaces partner (4-5 dias)

- `apps/web/src/app/partner/claim/page.tsx`
- `apps/web/src/app/partner/panel/page.tsx`
- `apps/web/src/app/partner/leads/page.tsx`

Objetivo:

- Aplicar shells, cards, tablas y formularios de wireframe partner sin alterar flujo de ownership/claims.

## Fase 4 — Interfaces admin (4-5 dias)

- `apps/web/src/app/admin/leads/page.tsx`
- `apps/web/src/app/admin/analytics/page.tsx`
- `apps/web/src/app/admin/partner-claims/page.tsx`
- `apps/web/src/app/admin/partner-claims/claim-status-actions.tsx`

Objetivo:

- Homologar visual de operacion (tablas, estados, acciones criticas).
- Mejorar legibilidad en desktop sin romper uso mobile.

## Fase 5 — Ajustes Release 2 ya disponibles (3-4 dias)

Aplicar patrones de wireframe R2 solo en funcionalidades existentes:

- Badges y relevancia: `/buscar`, `/gyms/[slug]`
- Favoritos y estado lead: `/favoritos`, `/lead/estado/[token]`
- Experimentos y metricas: `/admin/analytics`
- Calidad/operacion: `/admin/leads`, `/admin/partner-claims`

## Fase 6 — QA, rollout y cierre (2-3 dias)

Tecnico:

- `pnpm verify`
- `pnpm test:e2e`
- `pnpm test:capability`
- `pnpm sprint5:flow-checklist`

Negocio/UX:

- Comparar KPI pre/post (search->profile, profile->lead, SLA partner).
- Validar accesibilidad basica (focus, labels, contraste).

Estrategia:

- Activacion por slices (usuario -> partner -> admin).
- Rollback por slice en caso de degradacion.

## 4) Orden recomendado de ejecucion

1. Fase 0 (baseline + taxonomia).
2. Fase 1 (tokens + componentes base).
3. Fase 2 (usuario MVP core).
4. Fase 3 (partner).
5. Fase 4 (admin).
6. Fase 5 (R2 ya implementado en producto).
7. Fase 6 (QA y rollout).

## 5) Riesgos y mitigacion

- Riesgo: desviacion de alcance hacia pantallas que no existen en `apps/web`.
  - Mitigacion: mapear solo interfaces con ruta real productiva.
- Riesgo: regresion funcional por refactor visual.
  - Mitigacion: smoke E2E antes y despues de cada fase.
- Riesgo: inconsistencia entre tokens wireframe y Tailwind actual.
  - Mitigacion: consolidar primero en `packages/ui` y `globals.css`, luego migrar pantallas.

## 6) Definition of done por interfaz migrada

- Fidelidad visual validada contra wireframe.
- Sin cambios de contrato/API/eventos.
- Estados `loading/empty/error` presentes.
- Route E2E asociada en verde.
- Documentacion de sprint actualizada (`docs/operations/sprints.md`, `docs/operations/EPICS_USER_STORIES_STATUS.md`).
- Cumplimiento de estilo global claro y legibilidad de formularios alineado con Home/Buscar (sin degradación a dark mode en bloques/campos de producto).
