# Contratos HTTP OpenAPI 3.1

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

Ver también [`docs/sprints.md`](../docs/sprints.md) y [`AGENTS.md`](../AGENTS.md).
