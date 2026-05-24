# Floit — UI Visual QA Checklist

Checklist operativo corto para validar consistencia visual en cualquier pantalla antes de cerrar una tarea UI/UX.

## 0) Referencia visual y alineación documental (obligatorio)

- [ ] Cada tarea UI/UX parte de una imagen de referencia explícita (adjunta por producto/usuario o frame Figma equivalente).
- [ ] La referencia visual usada está identificada por ruta/pantalla objetivo (`/ruta`) y alcance (desktop, mobile o ambos).
- [ ] La propuesta visual mantiene coherencia con la línea gráfica vigente de:
  - Home (`/`),
  - Buscar (`/buscar`),
  - Ficha de gym (`/gyms/[slug]`).
- [ ] Antes de cerrar cambios, se valida alineación con:
  - `docs/product/PLAN_MAESTRO.md`,
  - `docs/product/PLAN_PROMPT_ENGINEERING.md`,
  - `docs/product/PRD.md`,
  - `docs/product/BACKLOG.md`,
  - y artefactos Figma (`docs/ux/FIGMA_UI_UX_MIGRATION_PLAN.md`, `docs/ux/FIGMA_SCREEN_INVENTORY.md`).

## Alcance

Aplica a:

- Usuario: `/`, `/buscar`, `/gyms/[slug]`, `/comparar`, `/favoritos`, `/lead/*`.
- Partner: `/partner/*`.
- Admin: `/admin/*`.

## 1) Tema y superficies (obligatorio)

- [ ] La pantalla usa estilo claro (sin degradación a bloques oscuros por tema del sistema).
- [ ] Superficies principales en `bg-white` / `bg-neutral-50`.
- [ ] Bordes coherentes en `border-neutral-200`.
- [ ] No hay clases `dark:*` activas en estructuras core de la vista.

## 2) Tipografía y legibilidad

- [ ] Títulos y labels con contraste legible (`text-neutral-800/900`).
- [ ] Textos secundarios en `text-neutral-500/600` sin perder lectura.
- [ ] Jerarquía visual clara (título > subtítulo > metadata > helper text).

## 3) Formularios (input/select/textarea)

- [ ] Campos con fondo claro (`bg-white`), borde neutral y texto oscuro.
- [ ] Placeholders legibles (`text-neutral-500` aprox).
- [ ] Label de cada campo visible y comprensible.
- [ ] Estados de error/éxito visibles y legibles.

## 4) Botones y acciones

- [ ] Acción primaria usa estilo de plataforma (`neutral-900` + texto blanco).
- [ ] Acciones secundarias con borde neutral y hover claro.
- [ ] CTA WhatsApp usa verde de plataforma y conserva contraste.
- [ ] No hay botones “invisibles” por bajo contraste.

## 5) Mapa y tarjetas contextuales (si aplica)

- [ ] Marcador seleccionado permanece visible (la tarjeta no tapa el pin).
- [ ] Click en marcador selecciona; click en área vacía limpia selección.
- [ ] Si hay lista vinculada al mapa, click en ítem enfoca + zoom al centro.
- [ ] En mobile, listado scrolleable y paginación incremental funcional.

## 6) Responsive

- [ ] Validado en desktop (>= 1024px).
- [ ] Validado en mobile (<= 430px).
- [ ] Sin desbordes horizontales.
- [ ] Sin solapamiento de bloques/CTAs.

## 7) Consistencia cross-screen

- [ ] La pantalla se percibe consistente con Home (`/`) y Buscar (`/buscar`).
- [ ] Tokens de color/espaciado coinciden con el sistema actual.
- [ ] No introduce estilo “aislado” que rompa el lenguaje visual global.

## 8) Cierre técnico mínimo

- [ ] Sin errores de lint en archivos modificados.
- [ ] Sin cambios de contrato/API/eventos por refactor visual.
- [ ] Documentación de diseño actualizada cuando el cambio afecta criterio global.

## Evidencia recomendada por tarea

- Captura desktop.
- Captura mobile.
- Nota corta de validación: "Checklist UI visual: PASS".
