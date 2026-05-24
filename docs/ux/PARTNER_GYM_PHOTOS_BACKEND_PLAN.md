# Plan backend - fotos de centros por partners

## Objetivo

Habilitar que partners gestionen fotos de sus centros y que esas fotos estén disponibles en la ficha pública para clientes, sin romper contratos existentes ni acoplar servicios fuera de sus bounded contexts.

## Diagnóstico de arquitectura (estado actual)

- `partner-service` ya es dueño del autoservicio partner (perfil, planes, ownership).
- `catalog-service` es dueño semántico de `venue` y ficha pública consumida por cliente.
- Ya existe flujo interno `partner -> catalog` por `POST /v1/internal/venues/{slug}/partner-sync`.
- No existe storage binario dedicado en esta iteración; hoy el sistema no maneja uploads de archivos con CDN.

## Decisión de implementación (MVP actual)

Implementar **Fase 1 URL-based**:

- Partners guardan `photoUrls` (lista de URLs públicas).
- `partner-service` valida, normaliza y sincroniza `photoUrls` por outbox al `catalog-service`.
- `catalog-service` persiste `photoUrls` en el venue y lo expone en `GET /v1/venues/{slug}`.

Esto habilita visualización inmediata en cliente sin bloquear por infraestructura de media binaria.

## Estado actual (después de continuar)

Ya quedó activa una **Fase 1.5 (upload real local)**:

- Upload multipart en `partner-service`.
- Validación de imágenes (`jpeg/png/webp`, hasta 5MB).
- Persistencia de metadata por venue en `partner_venue_photos`.
- Publicación estática en `/uploads/*` desde `partner-service`.
- Sincronización automática `partner -> catalog` para exponer fotos en ficha pública.
- Reordenamiento manual de fotos:
  - movimiento puntual (`up/down`) por foto,
  - reordenamiento global por lista de IDs (soporte para drag-and-drop en panel partner).
- Selección explícita de portada:
  - endpoint para marcar una foto como portada y moverla a la posición `sortOrder=0`.
  - metadata Open Graph de `gyms/[slug]` usa la portada cuando existe.

## Cambios técnicos aplicados

### Partner service

- `PartnerProfileEntity` ahora incluye `photoUrls`.
- `UpdatePartnerProfileDto` acepta `photoUrls` (array de URL, máximo 12).
- `getProfile` y `upsertProfile` retornan `photoUrls`.
- Sanitización en backend:
  - trim,
  - deduplicación,
  - límite de 12.
- `enqueueVenueCatalogSync` ya incluye `photoUrls` en payload de sync.

### Catalog service

- `VenueEntity` ahora incluye `photoUrls`.
- `UpdatePartnerSyncDto` acepta `photoUrls` (array de URL, máximo 12).
- `applyPartnerSync` persiste `photoUrls` con sanitización.
- `GET /v1/venues/{slug}` ya expone `photoUrls`.

### Contratos OpenAPI

- `openapi/partner.yaml`:
  - `PartnerProfile.photoUrls`
  - `PartnerProfileUpdate.photoUrls`
  - `PATCH /v1/partner/me/venues/{venueSlug}/photos/{id}/order`
  - `PATCH /v1/partner/me/venues/{venueSlug}/photos/reorder`
  - `PATCH /v1/partner/me/venues/{venueSlug}/photos/{id}/cover`
- `openapi/catalog.yaml`:
  - `VenuePublicDetail.photoUrls`
  - payload interno de `partner-sync` con `photoUrls`

## Validación técnica

- Typecheck OK:
  - `@floit/partner-service`
  - `@floit/catalog-service`
- Lints sin nuevos errores en rutas editadas.

## Siguiente fase recomendada (upload de archivo real)

Para soportar "cargar foto" como archivo binario (no solo URL), ejecutar Fase 2:

1. **Media service** (nuevo bounded context): emisión de URL firmada de upload y metadata.
2. **Object storage + CDN**: S3/R2/GCS + políticas de acceso público controlado.
3. **Flujo seguro**: partner pide URL firmada, sube archivo directo al bucket, confirma asset.
4. **Moderación opcional**: estado `pending/approved/rejected` antes de publicación.
5. **Sync a catalog**: `catalog` solo consume referencias de media aprobada, nunca binarios.

## Riesgos y mitigación

- **URLs rotas/externas**: validar formato + monitoreo; en fase 2 mover a storage propio.
- **Contenido no moderado**: añadir moderación en admin para fase 2.
- **Payload grande**: límite de 12 imágenes y sanitización.
