# Floit — backlog tecnico UI/UX (wireframe -> producto)

Backlog ejecutable para implementar las interfaces de `Floit Wireframe v.0.2` en `apps/web`, sin romper funcionalidad MVP.

## Convenciones

- Escala de estimacion: `S` (0.5-1 dia), `M` (1-2 dias), `L` (2-3 dias).
- Prioridad: `P0` critico, `P1` alto, `P2` medio.
- Dependencias: ticket(s) que deben cerrarse antes.

## Epic UX-0 — Baseline y taxonomia

### UX-001 — Crear matriz de taxonomia Figma->Floit
- **Prioridad:** P0
- **Estimacion:** M
- **Dependencias:** ninguna
- **Archivos:** `docs/ux/FIGMA_TAXONOMY_MAPPING.md`
- **Criterio de aceptacion:** terminos clave mapeados con decision `map/introduce/drop` y aprobacion de producto.

### UX-002 — Inventario de pantallas y estados
- **Prioridad:** P0
- **Estimacion:** M
- **Dependencias:** UX-001
- **Archivos:** `docs/ux/FIGMA_SCREEN_INVENTORY.md`
- **Criterio de aceptacion:** listado completo de pantallas wireframe + estado `loading/empty/error/success` + mapeo a ruta real.

### UX-003 — Congelar baseline E2E de no regresion
- **Prioridad:** P0
- **Estimacion:** S
- **Dependencias:** ninguna
- **Archivos:** `apps/web/e2e/capability-search-profile-compare-lead.spec.ts`, `apps/web/e2e/lead-flow.spec.ts`
- **Criterio de aceptacion:** pruebas core estables y documentadas como baseline antes de migracion visual.

## Epic UX-1 — Fundacion design system productivo

### UX-101 — Implementar tokens semanticos en `packages/ui`
- **Prioridad:** P0
- **Estimacion:** L
- **Dependencias:** UX-001
- **Archivos:** `packages/ui/src/tokens.ts`, `packages/ui/src/index.tsx`
- **Criterio de aceptacion:** tokens de color, spacing, radius, tipografia y elevacion exportados y usados por componentes.

### UX-102 — Componentes base (Button/Input/Card/Badge)
- **Prioridad:** P0
- **Estimacion:** L
- **Dependencias:** UX-101
- **Archivos:** `packages/ui/src/button.tsx`, `packages/ui/src/input.tsx`, `packages/ui/src/card.tsx`, `packages/ui/src/badge.tsx`, `packages/ui/src/index.tsx`
- **Criterio de aceptacion:** componentes reutilizables con variantes y sin estilos ad-hoc en rutas finales.

### UX-103 — Componentes operativos (Table/EmptyState/Banner)
- **Prioridad:** P1
- **Estimacion:** M
- **Dependencias:** UX-101
- **Archivos:** `packages/ui/src/table.tsx`, `packages/ui/src/empty-state.tsx`, `packages/ui/src/banner.tsx`, `packages/ui/src/index.tsx`
- **Criterio de aceptacion:** tablas y estados base listos para admin/partner.

### UX-104 — Integrar tokens en web global
- **Prioridad:** P0
- **Estimacion:** M
- **Dependencias:** UX-101
- **Archivos:** `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`, `apps/web/src/app/layout.tsx`
- **Criterio de aceptacion:** tema global coherente con tokens wireframe y sin regresiones de contraste/focus.

### UX-105 — Estandarizar tema claro en UI base de producto
- **Prioridad:** P0
- **Estimacion:** M
- **Dependencias:** UX-104
- **Archivos:** `packages/ui/src/card.tsx`, `packages/ui/src/input.tsx`, `packages/ui/src/select.tsx`, `packages/ui/src/button.tsx`, `packages/ui/src/badge.tsx`, `packages/ui/src/banner.tsx`
- **Criterio de aceptacion:** rutas de producto usan estilo claro consistente con Home/Buscar, evitando herencia visual oscura en bloques y campos de formulario.

## Epic UX-2 — Migracion interfaces usuario core

### UX-201 — Rediseño de discovery (`/buscar`)
- **Prioridad:** P0
- **Estimacion:** L
- **Dependencias:** UX-102, UX-104
- **Archivos:** `apps/web/src/app/buscar/buscar-client.tsx`, `apps/web/src/app/buscar/page.tsx`
- **Criterio de aceptacion:** UI alineada a wireframe manteniendo query params, filtros y tracking.
- **Estado actual:** completado (desktop + mobile-first), incluye toolbar, filtros compactos mobile y layout de lista.

### UX-202 — Rediseño de mapa discovery
- **Prioridad:** P1
- **Estimacion:** M
- **Dependencias:** UX-201
- **Archivos:** `apps/web/src/app/buscar/discovery-map.tsx`
- **Criterio de aceptacion:** layout de mapa consistente con modo lista y fallback sin errores.
- **Estado actual:** completado con:
  - desktop: listado lateral + mapa + tarjeta destacada,
  - mobile: overlays + bottom-sheet,
  - marcador con icono custom y tap/click abre popup con CTA `Ver ficha`.

### UX-203 — Rediseño ficha gym
- **Prioridad:** P0
- **Estimacion:** L
- **Dependencias:** UX-102, UX-104
- **Archivos:** `apps/web/src/app/gyms/[slug]/page.tsx`, `apps/web/src/app/gyms/[slug]/gym-direct-contact.tsx`
- **Criterio de aceptacion:** jerarquia visual nueva con misma data/CTAs existentes.

### UX-204 — Rediseño formulario lead + confirmacion + estado
- **Prioridad:** P0
- **Estimacion:** L
- **Dependencias:** UX-203
- **Archivos:** `apps/web/src/app/gyms/[slug]/gym-contact-section.tsx`, `apps/web/src/app/lead/confirmacion/page.tsx`, `apps/web/src/app/lead/estado/[token]/page.tsx`, `apps/web/src/app/privacidad/page.tsx`
- **Criterio de aceptacion:** no se alteran payloads, consent, Turnstile ni experimento CTA.
- **Criterio adicional:** labels/títulos legibles en tema claro y `input/select/textarea` con superficie clara y contraste estable.

### UX-205 — Rediseño comparador y favoritos
- **Prioridad:** P1
- **Estimacion:** M
- **Dependencias:** UX-201, UX-203
- **Archivos:** `apps/web/src/app/comparar/page.tsx`, `apps/web/src/app/favoritos/page.tsx`
- **Criterio de aceptacion:** UI consistente y continuidad del flujo de decision.
- **Estado actual:** completado, con extensión en home para acciones rápidas de `Guardar` y `Comparar` desde cards destacadas.

### UX-206 — Home wireframe funcional (`/`)
- **Prioridad:** P0
- **Estimacion:** M
- **Dependencias:** UX-102, UX-104
- **Archivos:** `apps/web/src/app/page.tsx`, `apps/web/src/app/home-location-button.tsx`, `apps/web/src/app/home-featured-actions.tsx`, `apps/web/src/app/home-favorites-link.tsx`
- **Criterio de aceptacion:** home desktop alineada a wireframe con buscador funcional, zonas/categorías activas, destacados dinámicos y acceso rápido a favoritos.
- **Estado actual:** completado.

## Epic UX-3 — Migracion interfaces partner

### UX-301 — Rediseño claim partner
- **Prioridad:** P1
- **Estimacion:** M
- **Dependencias:** UX-103, UX-104
- **Archivos:** `apps/web/src/app/partner/claim/page.tsx`
- **Criterio de aceptacion:** formulario claim alineado a wireframe y validaciones intactas.

### UX-302 — Rediseño panel partner (perfil + planes)
- **Prioridad:** P1
- **Estimacion:** L
- **Dependencias:** UX-301
- **Archivos:** `apps/web/src/app/partner/panel/page.tsx`
- **Criterio de aceptacion:** legibilidad y acciones principales optimizadas en mobile y desktop.

### UX-303 — Rediseño bandeja de leads partner
- **Prioridad:** P1
- **Estimacion:** M
- **Dependencias:** UX-302
- **Archivos:** `apps/web/src/app/partner/leads/page.tsx`
- **Criterio de aceptacion:** estados de lead y acciones de seguimiento sin regresion funcional.

## Epic UX-4 — Migracion interfaces admin

### UX-401 — Rediseño admin leads
- **Prioridad:** P1
- **Estimacion:** L
- **Dependencias:** UX-103, UX-104
- **Archivos:** `apps/web/src/app/admin/leads/page.tsx`
- **Criterio de aceptacion:** tabla y operaciones (CSV, DLQ, retry) visualmente homologadas y usables.

### UX-402 — Rediseño admin analytics
- **Prioridad:** P1
- **Estimacion:** L
- **Dependencias:** UX-103, UX-104
- **Archivos:** `apps/web/src/app/admin/analytics/page.tsx`
- **Criterio de aceptacion:** KPIs, funnel y experimentos con nueva jerarquia visual sin perder datos.

### UX-403 — Rediseño admin partner claims
- **Prioridad:** P1
- **Estimacion:** L
- **Dependencias:** UX-401
- **Archivos:** `apps/web/src/app/admin/partner-claims/page.tsx`, `apps/web/src/app/admin/partner-claims/claim-status-actions.tsx`
- **Criterio de aceptacion:** acciones criticas (aprobar/rechazar/retry/revocar) claramente diferenciadas.

## Epic UX-5 — QA, rollout y cierre

### UX-501 — Actualizar E2E por nuevos selectores/accesibilidad
- **Prioridad:** P0
- **Estimacion:** M
- **Dependencias:** UX-201, UX-204, UX-205, UX-303, UX-403
- **Archivos:** `apps/web/e2e/capability-search-profile-compare-lead.spec.ts`, `apps/web/e2e/lead-flow.spec.ts`
- **Criterio de aceptacion:** suite E2E estable sin sleeps fijos y alineada a nuevos labels/roles.

### UX-502 — Validar KPI post-migracion
- **Prioridad:** P0
- **Estimacion:** S
- **Dependencias:** UX-501
- **Archivos:** `docs/operations/STAGING_EVIDENCE_SPRINT5.md` (actualizacion) y evidencia de analitica
- **Criterio de aceptacion:** no degradacion significativa en search->profile, profile->lead y SLA partner.

### UX-503 — Cierre documental de migracion
- **Prioridad:** P1
- **Estimacion:** S
- **Dependencias:** UX-502
- **Archivos:** `docs/operations/sprints.md`, `docs/operations/EPICS_USER_STORIES_STATUS.md`, `docs/operations/PROJECT_CONTEXT_HANDOVER.md`, `docs/operations/NEXT_AGENT_BRIEF.md`
- **Criterio de aceptacion:** estado de migracion reflejado en fuente unica de verdad del proyecto.

## Sprints propuestos para ejecutar el backlog

- **Sprint 8 (UI Foundation + User Core):**
  - UX-001, UX-002, UX-003, UX-101, UX-102, UX-104, UX-201, UX-202
- **Sprint 9 (User Conversion + Partner):**
  - UX-203, UX-204, UX-205, UX-301, UX-302, UX-303
- **Sprint 10 (Admin + QA + Rollout):**
  - UX-401, UX-402, UX-403, UX-501, UX-502, UX-503

## Dependencias externas a resolver antes de Sprint 8

- Aprobacion de terminos de taxonomia y naming UX (producto/diseno).
- Definicion de alcance visual MVP vs R2 (para evitar scope creep).
- Confirmacion de entornos para medir KPI comparativo pre/post.
