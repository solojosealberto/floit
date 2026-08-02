# Guía de trabajo — Revisar y completar el catálogo de gimnasios (Caracas)

**Producto:** QueGym  
**Para quién:** asistente junior del equipo (sin necesidad de saber programación)  
**Dónde trabajas:** sitio de prueba (`https://staging.quegym.com`) + Google Sheets  
**Última actualización:** 2026-07-30  

**PDF (recomendado para compartir):** [`CATALOG_DATA_QUALITY_AND_EXPANSION_SCOPE.pdf`](./CATALOG_DATA_QUALITY_AND_EXPANSION_SCOPE.pdf)  
**Ejemplo de tabla para Sheets:** [`assets/catalog-scope/ejemplo-tabla-gimnasios.csv`](./assets/catalog-scope/ejemplo-tabla-gimnasios.csv)  
**Assets / regenerar PDF:** `docs/operations/assets/catalog-scope/`

---

## En una frase

Confirma que lo publicado sea verdad, complétalo bien, y suma el resto de Caracas — usando Sheets, el panel admin y fuentes como Maps o Instagram — siempre en el ambiente de prueba y **sin inventar datos**.

---

## Palabras útiles (glosario)

| Palabra | Significado sencillo |
|---------|----------------------|
| Catálogo | La lista de gimnasios que aparecen en QueGym |
| Sitio de prueba (staging) | Versión de prueba del sitio; ahí trabajas |
| Panel admin | Pantalla interna para ver y editar gimnasios |
| Sheet / hoja | Tu tabla en Google Sheets |
| CSV | Archivo de tabla que exportas desde Sheets |
| Ficha | La página de un gimnasio en QueGym |
| Evidencia | Prueba de que el dato es real (Maps, IG, llamada…) |
| Duplicado | El mismo local cargado dos veces |

---

## 1. ¿Qué debes lograr?

Dos metas que van juntas:

1. **Datos verdaderos** — Revisar cada gimnasio ya publicado: ¿existe? ¿está abierto? ¿coinciden nombre, zona, teléfono, precio y fotos?
2. **Sumar los que faltan** — Encontrar gimnasios de Caracas que aún no están y cargarlos con la misma calidad.

**Regla de oro:** cada fila debe poder demostrarse con una fuente externa.

---

## 2. Qué sí / qué no

### Sí

- Auditar los ~95 ya publicados  
- Corregir datos dudosos  
- Detectar duplicados  
- Investigar y agregar faltantes  
- Usar Sheets, panel admin, Maps, Instagram, WhatsApp  
- Anotar evidencia (fuente + fecha)  
- Reportar bloqueos  

### No

- Cambiar el código de la app  
- Publicar en el sitio final sin autorización  
- Inventar precios, teléfonos o fotos  
- Manejar claves técnicas del servidor  

---

## 3. Cómo está el catálogo hoy

| Tema | Situación |
|------|-----------|
| Cantidad | ~95 gimnasios ya cargados |
| Sitio de prueba | https://staging.quegym.com |
| Buscar | `/buscar` |
| Huecos frecuentes | Precio (~60% completo); perfiles “bien listos” ~52% |

Prioridad: completar **precio / contacto / fotos** y ampliar cobertura.

---

## 4. Tu rol

1. Investigar con fuentes reales  
2. Registrar en Google Sheets  
3. Corregir en panel admin cuando corresponda  
4. Actualizar estados  
5. Escalar dudas  

**Estados de la columna Estado:**  
`Pendiente` → `En revisión` → `Verificado` → `Publicado`  
Salidas: `Bloqueado` · `Duplicado` · `Cerrado`

---

## 5. La tabla en Google Sheets (cómo crearla)

**Cada fila = una sede.** Si un gym tiene dos locales, son dos filas.

### Columnas de datos (copia estos nombres)

| Columna | Qué poner | Ejemplo |
|--------|-----------|---------|
| Nombre del Gimnasio | Nombre comercial de la sede | Gold's Gym (Sede C.C. San Ignacio) |
| Zona / Municipio | Municipio canónico | Chacao |
| Categoría | Tipo de centro | Gimnasio Integral / Fitness Center |
| Link de Google Maps | Enlace que abre el lugar | https://maps.app.goo.gl/… |
| Teléfono / WhatsApp | Número de contacto | 0212-2642045 |
| Instagram | Usuario con @ | @goldsgymve |
| Precio Mensual semanal o diario (Ref.) | Precio de referencia | 80$ mensual |
| Planes | Planes especiales | Estudiantil, familiar… |
| Amenidades | Separadas por \| o comas | Sauna \| Parking \| Duchas |
| Actividades | Separadas por \| o comas | Cycling \| Pilates \| Yoga |
| Horario (Resumen) | Texto corto | Lun-Vie 6am–9pm |
| Fotos (URLs) | Links que abran la imagen | https://…/foto.jpg |

### Columnas de control

| Columna | Valores |
|--------|---------|
| Estado | Pendiente / En revisión / Verificado / Publicado / Bloqueado / Duplicado / Cerrado |
| Existe confirmado | Sí / No |
| Fuente verificada | Ej. Google Maps + Instagram |
| Notas de evidencia | Qué revisaste |
| Acción | corregir / alta_nueva / sin_cambio / excluir |
| Listo para cargar | Sí solo si la fila está completa y verificada |

### Zonas permitidas

Chacao · Baruta · Libertador · Sucre · El Hatillo · Guatire · Guarenas · San Antonio de los Altos

### Ejemplo de 3 filas

Ver archivo listo para importar a Sheets:  
[`ejemplo-tabla-gimnasios.csv`](./assets/catalog-scope/ejemplo-tabla-gimnasios.csv)

Resumen:

| Nombre | Zona | Teléfono | Precio | Estado | Listo |
|--------|------|----------|--------|--------|-------|
| Gold's Gym (Sede C.C. San Ignacio) | Chacao | 0212-2642045 | 80$ mensual | Verificado | Sí |
| Black Rock GYM | Baruta | 0412-8958723 | 15$ diario | En revisión | No |
| Nuevo Gym Ejemplo | Libertador | 0414-0000000 | consultar | Pendiente | No |

Detalle de la fila bien hecha (Gold’s):

- Amenidades: `Sauna | Estacionamiento | Lockers | Duchas`  
- Actividades: `Cycling | Pilates | Yoga | TRX`  
- Fuente: Google Maps + Instagram `@goldsgymve`  
- Notas: `Revisado 2026-07-30: abierto; teléfono responde; fotos OK`  

---

## 6. Tipos de centro (categoría)

| Si el negocio es… | Escribe en Categoría… |
|-------------------|------------------------|
| Pesas / integral / fitness | Gimnasio Integral / Fitness Center |
| CrossFit / funcional | Entrenamiento funcional / híbrido |
| Estudio de yoga | Yoga |
| Estudio de pilates | Pilates |
| Spinning | Cycling / Spinning |
| Entrenador personal | Entrenamiento personal |
| Mezcla de deportes | Centro mixto / club |

**Truco:** un gimnasio grande que también da pilates sigue siendo gimnasio integral.

---

## 7. Herramientas

1. **Google Sheets** — fuente de verdad diaria  
2. **Panel admin** — correcciones de 1 a 20 centros (`/admin/catalogo`)  
3. **Carga por lote** — exportas CSV; el responsable lo sube  
4. **Fuentes externas** — Maps, IG, web, WhatsApp/llamada  

Orden de verificación: Maps → redes/web → llamada si hace falta → comparar con QueGym → chequear duplicados.

---

## 8. Cuándo está “listo”

### Obligatorio

- [ ] Nombre correcto  
- [ ] Zona correcta  
- [ ] Link de Maps al lugar correcto  
- [ ] Categoría coherente  
- [ ] Actividades o descripción clara  
- [ ] Prueba externa anotada  
- [ ] No es duplicado  

### Muy recomendado

- [ ] Teléfono o WhatsApp  
- [ ] ≥1 foto con URL que abra  
- [ ] Precio de referencia  
- [ ] Horario  
- [ ] Instagram o web  

### No cargar si

Cerrado definitivo · solo nombre sin ubicación · foto que no abre · duplicado claro · datos contradictorios sin resolver.

---

## 9. Plan por etapas

0. **Arranque** (1–2 días): leer guía, accesos, practicar con 5  
1. **Revisión:** los ~95 (10–15/día por zona)  
2. **Ampliar:** faltantes, sin duplicar, marcar Listo  
3. **Cierre:** huecos de precio/foto/contacto + reporte  

---

## 10. Accesos y entregas

### Pide al responsable

- Usuario del panel admin (sitio de prueba)  
- Editor del Google Sheet  
- Confirmación de trabajar solo en prueba  
- Canal de dudas  

### No toques

- Claves técnicas del servidor  
- Producción / www sin aviso  
- Inventar datos  

### Entregables

1. Sheet actualizado  
2. CSV de lotes listos (cuando pidan)  
3. Correcciones visibles en el sitio de prueba  
4. Resumen semanal  
5. Lista de exclusiones con motivo  

### Reglas de oro

1. Veracidad > velocidad  
2. Una fila = una sede  
3. No inventar  
4. No borrar masivo sin permiso  
5. Si ya existe → corregir, no duplicar  
6. Actividad rara → preguntar  
7. Evidencia con fuente + fecha  
8. Solo sitio de prueba  

### Escalación

| Situación | Con quién |
|-----------|-----------|
| Sin acceso | Ops |
| Carga de lote | Responsable técnico / datos |
| ¿Es duplicado? | Lead de datos |
| Cerrado / sensible | Ops |
