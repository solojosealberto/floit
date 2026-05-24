# ADR 001 — Monorepo TypeScript y bounded contexts (MVP)

## Estado

Aceptada · 2026-04-22

## Contexto

Floit MVP se define como *discovery*, comparación y *leads* en Caracas, con capa partner/admin y analítica del embudo (PRD y backlog). El plan maestro recomienda pocos servicios alineados a capacidades de negocio, contratos explícitos y datos por servicio donde haya *ownership* real.

## Decisión

- Monorepo `pnpm` con aplicación **Next.js** (`@floit/web`) como UI/BFF inicial y paquetes compartidos `@floit/ui` y `@floit/contracts`.
- Servicios HTTP **NestJS** independientes por contexto de MVP: **catalog**, **search**, **leads**, **partner**, **analytics** (puertos locales 4010–4014), con `/health` y evolución hacia OpenAPI en `/openapi`.
- Contratos públicos HTTP en **OpenAPI 3.1** bajo `/openapi`; eventos de integración en **JSON Schema** bajo `/contracts/events`.
- Integración asíncrona futura mediante **transactional outbox** (no implementada aún); prohibido mezclar persistencia de un servicio en tablas “propias” de otro.

## Consecuencias

- El *search index* y rankings no son fuente de verdad; el catálogo publica cambios y el buscador es proyección.
- Se acepta coste operativo de varios deployables a cambio de fronteras claras y CI por paquete.
- Autenticación de partner/admin se delegará a **OIDC** (Auth0/Keycloak); no hay auth propia en el MVP.
