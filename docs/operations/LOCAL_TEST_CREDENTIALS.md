# Credenciales locales de prueba (dev)

Uso exclusivo para entorno local de desarrollo.  
No usar en producción.

## Admin (web)

- Email: `solojosehernandez@gmail.com`
- Password: `12345asdf`
- Login: `/admin/login`
- **Configuración:** `/admin/configuracion` — resumen de sesión local, flags de auth del BFF (sin secretos), enlaces a documentación operativa y accesos rápidos (`admin-config-summary.ts`).
- Catálogo → **editar** un centro abre **`/admin/catalogo/<slug>/panel`**: misma interfaz que el panel partner (perfil, planes, fotos, leads) pero con APIs admin; no hace falta iniciar sesión como partner.
- **Taxonomías:** `/admin/taxonomias` usa el BFF hacia `catalog-service`; en local el token **`ADMIN_API_TOKEN`** debe coincidir entre **`apps/web`** y **`services/catalog`** (ver `docs/env/local.example`).
- **Leads admin:** `/admin/leads` — botón **Ver** abre el detalle del lead; requiere **`leads-service`** en marcha y mismo **`ADMIN_API_TOKEN`** en `apps/web` y env del servicio leads (u OIDC admin).
- **Solicitudes partner:** `/admin/partner-claims` — tabla con **Ver detalle** (modal), aprobar/rechazar; bloque **`#operaciones-y-sync`** (health, DLQ sync/outbox, ownership, auditoría). Requiere **`partner-service`** y tokens internos alineados con catalog para el flujo de alta nueva (ver `PROJECT_CONTEXT_HANDOVER` y `LOCALHOST_LINKS_GUIDE`).
- Centros **sin** ownership en partner: configurar `ADMIN_CATALOG_DELEGATE_EMAIL` en el **servicio partner** (ver `docs/operations/LOCALHOST_LINKS_GUIDE.md`) o el panel devolverá error de delegación.

## Partner (web)

- Email: `partner.demo@floit.local`
- Password: `FloitPartner2026!`
- Login: `/partner/login`
- Centro asociado (ownership): **ninguno por defecto** tras retirar el seed demo `oxide-chacao` del catálogo. Para QA partner, sembrar ownership sobre un slug importado, por ejemplo `gym-fitness-caracas`:

```bash
cd services/partner
node ./scripts/seed-ownership.mjs --email partner.demo@floit.local --venue gym-fitness-caracas --status active
```

Luego: `/partner/panel?venueSlug=gym-fitness-caracas`

## Notas operativas

- Estas credenciales dependen de variables locales en `apps/web/.env.local`.
- Catálogo público: ~95 centros importados (ver `docs/operations/VENUES_CATALOG_IMPORT.md`); ejemplos de ficha: `/gyms/gym-fitness-caracas`, `/gyms/gold-s-gym-sede-c-c-san-ignacio`.
