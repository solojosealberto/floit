# Floit — mapeo de taxonomia Figma -> Floit

Matriz base para Sprint 8. Se usa antes de implementar cualquier pantalla.

## Convenciones

- `match`: `exacto`, `sinonimo`, `nuevo`, `deprecado`
- `decision`: `map`, `introduce`, `drop`

## Criterios globales de estilo (obligatorios en toda la plataforma)

- La plataforma Floit se estandariza en **tema claro** para pantallas de producto (`/`, `/buscar`, `/gyms`, `/comparar`, `/favoritos`, `/partner/*`, `/admin/*`).
- No se deben introducir variantes visuales oscuras en componentes de UI base para vistas productivas (evitar `dark:*` en estructuras core).
- Todos los formularios deben mantener:
  - labels y títulos con contraste legible (`text-neutral-800/900`),
  - campos con fondo claro (`bg-white`), texto oscuro y placeholder legible.
- Superficies y bloques siguen el lenguaje de Home/Buscar:
  - `bg-white` / `bg-neutral-50`,
  - `border-neutral-200`,
  - acción primaria `neutral-900`,
  - acción WhatsApp en verde de plataforma.

| Termino Figma | Termino Floit actual | Match | Decision | Nota |
|---|---|---|---|---|
| Discovery | Buscar centros | sinonimo | map | Corresponde a `/buscar` |
| Results List | Lista de resultados | exacto | map | `buscar-client.tsx` |
| Results Map | Mapa | exacto | map | `discovery-map.tsx` |
| Marker Tap Card | Popup/tarjeta sobre marcador | sinonimo | map | marcador abre popup con CTA `Ver ficha` |
| Gym Detail | Ficha gym | sinonimo | map | `/gyms/[slug]` |
| Lead Form | Formulario lead | exacto | map | `gym-contact-section.tsx` |
| Confirmation | Confirmacion de lead | exacto | map | `/lead/confirmacion` |
| Compare | Comparar centros | exacto | map | `/comparar` |
| Favorites | Favoritos | exacto | map | `/favoritos` |
| Partner Claim | Claim partner | exacto | map | `/partner/claim` |
| Partner Dashboard | Panel partner | exacto | map | `/partner/panel` |
| Leads Inbox | Bandeja de leads partner | exacto | map | `/partner/leads` |
| Admin Dashboard | Admin analytics/leads | sinonimo | map | repartido entre dos rutas |
| Catalog Admin | Admin catalogo dedicado | nuevo | introduce | no existe pagina dedicada en `apps/web` |
| Roles & Permissions | RBAC admin/partner | sinonimo | map | implementado a nivel backend/guard |
| Compliance | Privacidad + consent + anti-spam | sinonimo | map | distribuido en web y leads-service |

## Notas de implementación de hoy

- Se mantiene convención de acción primaria en desktop con label textual (`Guardar`).
- En mobile, acciones de favorito se representan como icono compacto (`☆/★`) para optimizar espacio.
- `Discovery` se implementa en variantes visuales desktop y mobile con misma taxonomía de filtros (`zone`, `venue_type`, `modality`, `budget_*`, `amenities`).

