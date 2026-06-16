# QueGym — assets públicos (`apps/web/public`)

## Marca (`/brand`)

| Archivo | Uso |
|---------|-----|
| `quegym-horizontal-light.png` | Logotipo horizontal — tema claro (header, drawer) |
| `quegym-horizontal-dark.png` | Logotipo horizontal — tema oscuro |
| `quegym-symbol-source.png` | Símbolo (favicon estático, PWA, variant `symbol`) |

Rutas centralizadas en `apps/web/src/lib/brand-assets.ts` y componente `QueGymLogo`.

## PWA

- `site.webmanifest` — icono apunta a `/brand/quegym-symbol-source.png`
- Favicon / apple-touch: `apps/web/src/app/icon.png`, `apple-icon.png` (generados desde el símbolo)
