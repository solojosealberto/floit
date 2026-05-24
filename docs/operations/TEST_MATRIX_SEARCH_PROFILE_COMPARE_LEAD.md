# Malla de pruebas — buscar -> ficha -> comparar -> lead

Cobertura implementada para la capability completa con datos reutilizables y ejecución por capas.

## Datos reutilizables

- Fixture común: `tests/fixtures/capability-search-profile-compare-lead.ts`
- Incluye:
  - zonas de prueba (`Chacao`, `Baruta`)
  - venues de ejemplo para búsqueda/ficha/comparación
  - payload de lead reutilizable para formulario y validaciones

## Unit tests

- `apps/web/src/lib/venue-badges.spec.ts`
  - valida reglas de badges en resultados (`closest`, `price`, `complete`)
- `apps/web/src/lib/format-upstream-error.spec.ts`
  - valida normalización de errores upstream para feedback del paso lead

## Integration tests (Testcontainers)

- `services/catalog/test/capability-search-profile-compare.integration.spec.ts`
  - levanta PostgreSQL efímero con Testcontainers
  - inicializa `catalog-service` con TypeORM sincronizado
  - inserta fixtures reutilizables
  - valida:
    - búsqueda por zona (`GET /v1/venues`)
    - ficha por slug (`GET /v1/venues/:slug`)

## Contract tests (OpenAPI)

- `tests/contracts/openapi-capability.contract.test.ts`
  - valida parseo/esquema OpenAPI de:
    - `openapi/search.yaml`
    - `openapi/catalog.yaml`
    - `openapi/leads.yaml`
  - asegura endpoints críticos de la capability:
    - `/v1/search`
    - `/v1/venues`
    - `/v1/venues/{slug}`
    - `/v1/leads`
    - `/v1/leads/status/{token}`

## E2E (Playwright)

- `apps/web/e2e/capability-search-profile-compare-lead.spec.ts`
  - flujo completo:
    - buscar con filtros
    - abrir ficha
    - comparar
    - enviar lead y verificar confirmación
  - sin `sleep` fijo:
    - usa `locator`, `getByRole`, `getByLabel`
    - usa assertions reintentables (`toBeVisible`, `toHaveURL`)

## Comandos

- Unit: `pnpm test:unit`
- Integration: `pnpm test:integration`
- Contract: `pnpm test:contract`
- E2E: `pnpm test:e2e` (requiere `E2E_WITH_SERVICES`)
- Suite capability: `pnpm test:capability`
