# Floit — trazabilidad wireframe a runtime

Indice para conectar referencias UX (`Floit Wireframe v.0.2/`) con implementaciones reales del runtime productivo.

## Como usar este indice

- Agrega una fila por slice migrado o actualizado.
- No uses este archivo para estado de sprint; solo para trazabilidad de origen UX -> destino runtime.
- El estado operativo de release se mantiene en `docs/operations/sprints.md`, `docs/operations/EPICS_USER_STORIES_STATUS.md` y `docs/operations/PROJECT_CONTEXT_HANDOVER.md`.

## Matriz de trazabilidad

| Dominio UX (wireframe) | Destino runtime | Contrato/Evidencia tecnica | Estado de migracion |
|---|---|---|---|
| Home / discovery | `apps/web/src/app/page.tsx` | `docs/operations/sprints.md` (Sprint 8-10) | Parcial |
| Resultados y mapa | `apps/web/src/app/buscar/*` | `docs/operations/sprints.md` (Sprint 8-10) | Parcial |
| Ficha + lead | `apps/web/src/app/gyms/[slug]/*`, `apps/web/src/app/api/leads/route.ts` | `openapi/leads.yaml`, `docs/operations/LOCALHOST_LINKS_GUIDE.md` | Parcial |
| Comparador y favoritos | `apps/web/src/app/comparar/page.tsx`, `apps/web/src/app/favoritos/page.tsx` | `docs/operations/sprints.md` | Parcial |
| Partner workspace | `apps/web/src/app/partner/*`, `services/partner/*` | `openapi/partner.yaml`, `docs/operations/sprints.md` | Parcial |
| Admin operativo | `apps/web/src/app/admin/*`, `services/leads/*`, `services/analytics/*` | `openapi/leads.yaml`, `openapi/analytics.yaml` | Parcial |

## Regla de mantenimiento

Cuando un PR implemente una pieza basada en wireframe:

1. actualizar/crear fila de trazabilidad en este archivo,
2. enlazar evidencia tecnica (contrato/prueba/ruta runtime),
3. si cambia estado funcional, actualizar tambien los 3 documentos fuente de estado operativo.
