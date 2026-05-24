# Floit — frontera entre wireframe y runtime

Este documento separa de forma explicita los artefactos de referencia UX de los artefactos de ejecucion productiva.

## 1) Dominios y responsabilidad

- **Runtime productivo**: `apps/web`, `services/*`, `packages/*`, `openapi/`, `contracts/events/`, `scripts/`.
- **Wireframe / referencia UX**: `Floit Wireframe v.0.2/`.
- **Archivo historico UX**: `docs/archive/wireframe-v0.2/` (indice y puntero de archivado).

## 2) Regla de alcance

- `Floit Wireframe v.0.2/` no define estado de sprint, release ni readiness operativa.
- El estado operativo vive solo en:
  - `docs/operations/sprints.md`
  - `docs/operations/EPICS_USER_STORIES_STATUS.md`
  - `docs/operations/PROJECT_CONTEXT_HANDOVER.md`

## 3) Frontera de consumo wireframe -> runtime

Solo migran al runtime los siguientes artefactos:

- decisiones de UX/UI (layout, componentes, flujos),
- tokens/convenciones visuales reutilizables,
- copy funcional validado.

No migran directamente:

- estados de avance narrativos del wireframe,
- criterios de release no respaldados por contratos/pruebas runtime,
- supuestos sin evidencia tecnica.

## 4) Criterio de aceptacion para migracion

Para considerar una migracion como cerrada, deben existir:

1. contrato o interfaz runtime (si aplica),
2. implementacion en ruta/capa productiva,
3. evidencia de prueba (minimo smoke + capa correspondiente),
4. actualizacion de documentos de estado operativo.

## 5) Gobernanza de PR

Si un PR toma insumos de `Floit Wireframe v.0.2/`, debe incluir referencia de trazabilidad en:

- `docs/governance/WIREFRAME_RUNTIME_TRACEABILITY.md`

y actualizar estado operativo en los 3 documentos fuente cuando aplique.

## 6) Criterio de retencion del wireframe

`Floit Wireframe v.0.2/` se mantiene mientras siga aportando referencia activa de migracion UX o QA visual. No se usa para ejecutar runtime.
