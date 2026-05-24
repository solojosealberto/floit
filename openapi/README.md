# Contratos HTTP OpenAPI 3.1

Producto: **QueGym**. Los `info.title` de cada YAML usan el prefijo «QueGym … API» (rebrand Fase 1). Los paquetes npm del monorepo siguen siendo `@floit/*` hasta una Fase 3 planificada — ver `docs/operations/REBRAND_QUEGYM_PLAN.md`.

Archivos alineados con el **plan maestro** (contrato-first, evolución por capability) y con la implementación actual en `services/*`.

| Archivo | Servicio | Puerto por defecto |
|---------|----------|-------------------|
| [`catalog.yaml`](./catalog.yaml) | `@floit/catalog-service` | 4010 |
| [`search.yaml`](./search.yaml) | `@floit/search-service` | 4011 |
| [`leads.yaml`](./leads.yaml) | `@floit/leads-service` | 4012 |
| [`partner.yaml`](./partner.yaml) | `@floit/partner-service` | 4013 |
| [`analytics.yaml`](./analytics.yaml) | `@floit/analytics-service` | 4014 |

## Flujo recomendado

1. Cambiar o añadir endpoints primero en el YAML correspondiente.
2. Implementar DTOs y controladores Nest en el servicio dueño (sin cruzar persistencia de otro bounded context).
3. Actualizar proxies BFF en `apps/web/src/app/api/*` si la web los consume.
4. Ejecutar `pnpm run typecheck` y `pnpm run build` en la raíz antes de merge.

Herramientas opcionales: Spectral (`spectral lint openapi/*.yaml`), `openapi-diff` entre ramas para compatibilidad backward.

### Nota: rutas admin de catálogo en partner-service

Las operaciones **`v1/admin/catalog/venues/:venueSlug/*`** (perfil, planes, leads, fotos) están implementadas en Nest y consumidas vía BFF en `apps/web` (`/api/admin/catalog/venues/...`). La especificación en [`partner.yaml`](./partner.yaml) puede incorporarse en una iteración contract-first; hasta entonces la referencia operativa está en `docs/operations/LOCALHOST_LINKS_GUIDE.md` y `docs/operations/WEB_ROUTES_PLATFORM.md`.

### Nota: admin leads en leads-service

Las operaciones de **listado, detalle, actualización de estado, export CSV y SLA** para backoffice están en [`leads.yaml`](./leads.yaml): **`GET /v1/admin/leads`**, **`GET/PATCH /v1/admin/lead/{id}`**, **`GET /v1/admin/leads/export.csv`**, **`GET /v1/admin/leads/sla-summary`**. El BFF web las expone bajo **`/api/admin/leads`**, **`/api/admin/leads/[id]`**, **`/api/admin/leads/export`**. La UI **`/admin/leads`** usa el detalle para el modal de gestión del lead.

### Nota: taxonomías admin en catalog-service

Las operaciones **`/v1/admin/taxonomy-attributes`** (lista, alta, parche por slug) viven en **`catalog-service`** y están descritas en [`catalog.yaml`](./catalog.yaml). El BFF web las expone en **`/api/admin/taxonomy-attributes`** (ver `apps/web/src/app/api/admin/taxonomy-attributes/`). Requiere el mismo esquema de autenticación admin (`x-admin-token` u OIDC) configurado también en el proceso catalog (`ADMIN_API_TOKEN` / emisor OIDC), alineado con `apps/web`.

### Nota: importación masiva de venues (catalog-service)

Alta/actualización interna por CSV operativo: **`POST /v1/internal/venues`** (`CreateInternalVenue` en [`catalog.yaml`](./catalog.yaml)) con token `x-internal-token`; planes vía **`POST /v1/internal/venues/{slug}/partner-sync`**. Pipeline documentado en [`docs/operations/VENUES_CATALOG_IMPORT.md`](../docs/operations/VENUES_CATALOG_IMPORT.md) y comandos `pnpm venues:*` en la raíz del monorepo.

Ver también [`docs/operations/sprints.md`](../docs/operations/sprints.md) y [`AGENTS.md`](../AGENTS.md).
