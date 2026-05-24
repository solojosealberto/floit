# Datos de catálogo — importación Caracas

| Archivo | Descripción |
|---------|-------------|
| `venues-caracas.source.csv` | Fuente original (95 centros). Reemplazar al actualizar el Excel/CSV del negocio. |
| `venues-caracas.normalized.json` | Salida del normalizador (registro listo para API + bloque `source` sin pérdida). |
| `venues-geocode-cache.json` | Caché de coordenadas (URLs Maps + Nominatim). |

## Comandos

```bash
pnpm venues:normalize          # CSV → JSON + geocodificación
pnpm venues:import             # JSON → catalog-service (requiere :4010)
pnpm venues:load               # normalize + import
pnpm venues:validate           # revisar JSON
pnpm venues:validate:live      # JSON + GET /v1/venues
```

Guía operativa: [`docs/operations/VENUES_CATALOG_IMPORT.md`](../docs/operations/VENUES_CATALOG_IMPORT.md).

Estado documentado en [`docs/operations/PROJECT_CONTEXT_HANDOVER.md`](../docs/operations/PROJECT_CONTEXT_HANDOVER.md) (§ catálogo Caracas) y [`docs/index.md`](../docs/index.md).
