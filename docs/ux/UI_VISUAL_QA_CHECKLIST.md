# QueGym — UI Visual QA Checklist

Checklist operativo para validar consistencia visual en cualquier pantalla antes de cerrar una tarea UI/UX. Aplica al sistema **dual-theme** QueGym (manual de marca + [`QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md`](./QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md)).

## 0) Referencia visual y alineación documental (obligatorio)

- [ ] Cada tarea UI/UX parte de una imagen de referencia explícita (adjunta por producto/usuario o frame Figma equivalente).
- [ ] La referencia visual usada está identificada por ruta/pantalla objetivo (`/ruta`) y alcance (desktop, mobile o ambos).
- [ ] La propuesta visual mantiene coherencia con la línea gráfica vigente de:
  - Home (`/`),
  - Buscar (`/buscar`),
  - Ficha de gym (`/gyms/[slug]`).
- [ ] Antes de cerrar cambios, se valida alineación con:
  - `docs/operations/REBRAND_QUEGYM_PLAN.md`,
  - `docs/ux/QUEGYM_BRAND_UI_IMPLEMENTATION_PLAN.md`,
  - `docs/ux/QUEGYM_BRAND_COPY_PLAN.md`,
  - `docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`.

## Alcance

Aplica a:

- Usuario: `/`, `/buscar`, `/gyms/[slug]`, `/comparar`, `/favoritos`, `/lead/*`.
- Partner: `/partner/*`.
- Admin: `/admin/*`.

## 1) Tema y superficies (obligatorio)

Validar **en ambos temas** (toggle header / sidebar):

### Dark (default público)

- [ ] Fondo página verde bosque (`--qg-bg-page`, ~`#050a05`), no gris azulado neutro.
- [ ] Cards/elevated en `#141c14`; inputs/placeholders en `#162116`.
- [ ] Bordes verde-gris (`--qg-border`).
- [ ] Texto secundario legible (`#8a968a`).

### Light (default admin/partner; opcional en público)

- [ ] Fondo página **White**; hero/banners **Mist** (`#EAFBF4`).
- [ ] Cards **White** con borde `#E5E7EB`.
- [ ] Texto principal **Ink** `#111827`; metadata **Slate** `#6B7280`.

### General

- [ ] Toggle persiste preferencia; sin FOUC al recargar.
- [ ] Cards interactivas usan elevación (`qg-surface` / `qg-surface-subtle`) con hover suave en desktop.
- [ ] CTAs primarios con `qg-btn-primary` (sombra Mint + lift ligero).
- [ ] `prefers-reduced-motion`: sin transform en hover.

## 2) Acentos y CTAs (manual de marca)

- [ ] **Mint `#12B76A` (`--qg-accent` / `--qg-highlight`):** Buscar, Reclamar centro, CTAs primarios, logo Q, favicon, toggles activos.
- [ ] **Green `#00875A`:** solo referencia de manual (`--qg-green`); no usar en CTAs salvo excepción editorial.
- [ ] **White sobre Green:** contraste ≥ 4.5:1 en botones primarios.
- [ ] Chips/filtros activos: borde Mint + fondo soft + texto Mint (no solo color de fondo).
- [ ] FAB WhatsApp en cards: círculo Mint sólido (`--qg-accent`), no gris.

## 2b) Tono verbal — Venezuela (manual §07)

Validar contra [`QUEGYM_BRAND_COPY_PLAN.md`](./QUEGYM_BRAND_COPY_PLAN.md) y referencias [propuesta de marca](https://propuestademarca.netlify.app/) / [UI aplicada](https://quegymconmarcaaplicada.netlify.app/).

- [ ] Hero: «Encuentra tu próximo gym en Caracas» + subtítulo con *Compáralos* / *Contacta directo*.
- [ ] **Sin voseo:** no *Encontrá*, *Tenés*, *Podés*, *Registrá*, *Reclamá*, *Elegí*, etc.
- [ ] Partner banner: «¿Tienes un gimnasio en Caracas?» · «Reclamar mi centro».
- [ ] Tono directo, local, honesto — no corporativo ni urgencia falsa.

## 3) Tipografía y legibilidad

- [ ] **Inter** body; **Barlow Semi Condensed** en headlines (hero, secciones).
- [ ] Jerarquía clara: título > subtítulo > metadata > helper.
- [ ] Palabra **gym** en hero resaltada en Mint/Green.

## 4) Formularios (input/select/textarea)

- [ ] Campos usan `--qg-bg-input` y `--qg-border`.
- [ ] Placeholders en `--qg-text-secondary` con contraste AA.
- [ ] **Focus:** borde mint **sutil** en el contenedor redondeado (`.qg-field:focus-within`), no rectángulo grueso sobre el input interno. Verificar home hero, `/buscar`, login partner/admin.
- [ ] Inputs con borde propio (`.qg-input`, `UITextInput`): highlight sigue `border-radius`.
- [ ] Estados error/éxito con tokens `--qg-error` / `--qg-highlight-soft`.

## 5) Mapa y tarjetas contextuales (si aplica)

- [ ] Marcador seleccionado visible (tarjeta no tapa el pin).
- [ ] Click en marcador selecciona; click en área vacía limpia selección.
- [ ] Lista vinculada al mapa: click enfoca + zoom al centro.
- [ ] Mobile: listado scrolleable; FAB «Ver mapa» en Green.

## 6) Responsive

- [ ] Desktop (≥ 1024px) y mobile (≤ 430px).
- [ ] Sin desbordes horizontales ni CTAs solapados.

## 6b) Menú móvil (header público)

Validar en viewport ≤ 768px (`md:hidden`):

- [ ] Botón ☰ abre drawer desde la derecha; overlay semitransparente detrás.
- [ ] **Panel del menú opaco** (`bg-quegym-page`) — enlaces legibles en dark y light (no se ve el contenido de la página a través del menú).
- [ ] Enlaces presentes: Explorar gimnasios, Comparar (con contador si aplica), Favoritos, ¿Eres partner?, Privacidad.
- [ ] Cerrar con ✕, tap en overlay o tecla Esc; scroll del body bloqueado mientras está abierto.
- [ ] `QueGymLogo` horizontal visible en cabecera del drawer.

## 7) Consistencia cross-screen

- [ ] Misma gramática cromática entre `/`, `/buscar`, `/gyms/[slug]`, `/comparar`, `/favoritos`.
- [ ] Partner login/claim/**panel** alineados a tokens QueGym (sin `#0a1430` legacy).
- [ ] Admin sidebar + páginas internas con tokens + toggle dual-theme.

## 8) Cierre técnico mínimo

- [ ] `pnpm --filter @floit/web exec tsc --noEmit` sin errores.
- [ ] Sin cambios de contrato/API/eventos por refactor visual.
- [ ] Docs operativos actualizados si cambia criterio global de tema.

*Última actualización: 2026-05-27 — dual-theme QueGym; menú móvil opaco (§6b)*
