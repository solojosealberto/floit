# Floit — inventario de pantallas wireframe (prioridad de implementacion)

Inventario operativo para ejecutar Sprint 8/9/10.

## Usuario core (P0)

| Wireframe | Ruta actual | Estado requerido |
|---|---|---|
| HomeScreens | `/` y `/buscar` | base, loading, empty, error |
| ResultsScreens | `/buscar` | base, empty, mobile-first refinado |
| MapScreens | `/buscar` (mapa) | base, degraded map, seleccion activa + focus/zoom + tarjeta anclada |
| DetailScreens | `/gyms/[slug]` | base, not found, layout desktop detallado (galeria + sidebar + planes/horarios/mapa) |
| FormAndConfirmScreens | `/gyms/[slug]`, `/lead/confirmacion` | base, form error, success |
| ContactStatesScreens | `/lead/estado/[token]` | base, invalid token |
| ComparatorScreens | `/comparar` | base, empty |

### Estado de implementación actual (hoy)

- `/` (HomeScreens): `completado` desktop wireframe + funcionalidades activas (búsqueda, zonas, categorías, destacados, favoritos).
- `/buscar` lista desktop: `completado` con sidebar de filtros funcional.
- `/buscar` mapa desktop: `completado` con listado lateral + tarjeta destacada.
- `/buscar` mobile lista/mapa: `completado` con filtros compactos desplegables y vista mapa optimizada.
- Marcadores mapa (`MapScreens`): `completado` icono custom + selección activa sin popup legacy, tarjeta única, click vacío limpia selección, focus+zoom por selección desde listado y anclaje lateral derecho de tarjeta.
- `/gyms/[slug]` (`DetailScreens`): `completado` rediseño estructural desktop alineado a wireframe (breadcrumb, galería, panel lateral de acciones, amenidades, planes, horarios y ubicación), manteniendo flujo de contacto/reporte.

### Criterio visual obligatorio por pantalla (global)

- `Tema`: claro consistente con Home/Buscar.
- `Bloques`: superficies en blanco/neutro claro, sin fondos oscuros en modo producto.
- `Formularios`: labels legibles + campos claros (input/select/textarea) con contraste suficiente.
- `UI base`: evitar variantes `dark:*` en componentes compartidos usados por rutas productivas.
- `Validación`: cada pantalla migrada debe verificarse en desktop/mobile con estos criterios antes de cierre.

## Partner (P1)

| Wireframe | Ruta actual | Estado requerido |
|---|---|---|
| LoginClaimScreens | `/partner/claim` | base, validacion |
| DashboardScreens | `/partner/panel` | base, empty |
| ProfileEditScreens | `/partner/panel` | base, success/error |
| PlansLeadsScreens | `/partner/panel`, `/partner/leads` | base, empty, error |
| PartnerStatesScreens | `/partner/*` | loading, empty, error |

## Admin (P1)

| Wireframe | Ruta actual | Estado requerido |
|---|---|---|
| AdminDashboardScreens | `/admin/analytics`, `/admin/leads` | base, empty |
| TaxonomyLeadsScreens | `/admin/leads` | base, empty, error |
| MetricsRolesScreens | `/admin/analytics` | base, no data |
| ComplianceStatesScreens | `/admin/*` | error states |
| CatalogScreens | sin ruta actual | pendiente de definicion |

## Release 2 (P2, solo lo implementado hoy)

| Wireframe | Ruta actual | Estado requerido |
|---|---|---|
| RelevanceBadgesScreens | `/buscar`, `/gyms/[slug]` | base |
| FavoritesLeadScreens | `/favoritos`, `/lead/estado/[token]` | base, empty |
| PromotionsQualityScreens | `/gyms/[slug]`, `/admin/*` | base |
| ExperimentsSEOScreens | `/admin/analytics`, SEO de rutas publicas | base |

