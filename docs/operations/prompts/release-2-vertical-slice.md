# Plantilla de prompt — Release 2 / Sprint 2 (vertical slice)

Tomado del **Plan prompt engineering Floit** (tabla “Release 2 | Relevancia, favoritos, SEO y experimentos”). Úsalo en Cursor cuando refines capacidades R2 sobre el código existente.

---

## Prompt base

> Implementa **Release 2** sobre los bounded contexts ya existentes: ranking compuesto, favoritos persistentes, badges basados en **reglas transparentes**, CTA de visita/prueba, estado de lead, páginas indexables de gym y zona, y A/B tests de CTA/form. **Mantén compatibilidad backward.** Entrega migraciones donde haya persistencia nueva, contratos OpenAPI actualizados y experiment flags donde aplique.

## Entradas esperadas

- Historias / US de Release 2 referenciadas en backlog o `docs/product/PRD.md`.
- Contratos actuales: `@openapi/catalog.yaml`, `@openapi/search.yaml`, `@openapi/leads.yaml`, `@openapi/analytics.yaml`.
- Reglas: `@.cursor/rules/architecture.mdc`, `@.cursor/rules/api-contracts.mdc`, `@AGENTS.md`.
- Estado del repo: `@docs/operations/sprints.md`.

## Salida esperada y validación

- Cambios por **capability** (no pantallas sueltas): catálogo, search, leads, analytics, web BFF.
- OpenAPI y DTOs coherentes; sin fetch directo del browser a microservicios (solo vía Next route handlers o Server Components).
- `pnpm run typecheck` y `pnpm run build` verdes; `pnpm run smoke:local` con servicios levantados.

## Modo y “temperatura” (recomendación del plan)

- **Plan Mode** primero si el cambio toca más de un servicio o el contrato.
- Trabajo determinista en contratos y validación (equivalente a temperatura baja en el modelo subyacente).

## Variante acotada — “Ripado fino Sprint 2”

> Sin ampliar scope a partner/admin: pulir SEO, errores de validación en formularios, scripts `docker:up` + `dev:services`, smoke local, consentimiento explícito en leads y página `/privacidad` borrador; documentar en `docs/operations/sprints.md`.

Este repositorio refleja esa variante donde aplica.
