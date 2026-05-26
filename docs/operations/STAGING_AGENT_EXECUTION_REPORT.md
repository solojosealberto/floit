# Informe agente — Deployment QueGym — 2026-05-25 (actualizado)

## Fase completada hasta

- [x] **1** Catalog + import — **95 venues** en Neon vía Railway catalog
- [ ] **2** Railway URLs + Vercel env — **pendiente** (Vercel no ve catálogo aún)
- [ ] **3** Smoke / gates / evidencias
- [ ] **4** Prod

## Catalog

- **/health:** OK
- **/health/ready:** `{"ok":true,"service":"catalog","venues":95}`
- **Import:** `pnpm venues:import:staging` → `Resumen: { created: 95 }`
- **validate:live:** OK (95/95)

## URLs Railway

- **catalog:** `https://floitcatalog-service-production.up.railway.app`
- **search / leads / partner / analytics:** anotar en Railway → Vercel (bloque B del runbook)

## Staging UI (tras import, sin redeploy Vercel)

- **/buscar:** carga pero listado vacío si `SEARCH_SERVICE_URL` en Vercel no apunta a search Railway
- **/gyms/gym-fitness-caracas:** 404 en staging (Vercel aún sin `CATALOG_SERVICE_URL` Railway)
- **/api/compare/search:** `items: []` (mismo motivo — usa search service)
- **/admin/login**, **/partner/login:** 200

## Decisión

**NO-GO** operativo en UI staging (datos OK en catalog; BFF desalineado).

### Próximo paso humano

1. **Vercel** → `floit-web` → Environment Variables (Preview) → setear:
   - `CATALOG_SERVICE_URL=https://floitcatalog-service-production.up.railway.app`
   - `SEARCH_SERVICE_URL=<URL pública del servicio search en Railway>`
2. **Redeploy** staging.
3. Probar `https://staging.quegym.com/buscar` y una ficha `/gyms/gym-fitness-caracas`.

### Seguridad

Rotar `CATALOG_INTERNAL_API_TOKEN` si el valor se compartió por chat; actualizar Railway catalog + partner + `docs/env/staging.local`.
