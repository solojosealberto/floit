# PRD — MVP Floit

**Agregador de centros de fitness en Caracas**

| Metadato | Valor |
|----------|-------|
| Tipo de documento | Requisitos de producto (prueba de concepto) |
| Versión | 1.0 |
| Fecha | 12 de abril de 2026 |
| Alcance geográfico inicial | Caracas / Distrito Capital |

---

## Tabla de contenidos

1. [Objetivo](#objetivo)
2. [Tesis de producto](#tesis-de-producto)
3. [Resumen ejecutivo](#resumen-ejecutivo)
4. [Contexto y oportunidad](#1-contexto-y-oportunidad)
5. [Visión del producto](#2-visión-del-producto)
6. [Objetivo del MVP y objetivos secundarios](#3-objetivo-del-mvp-y-objetivos-secundarios)
7. [Alcance del MVP](#4-alcance-del-mvp)
8. [Hipótesis a validar](#5-hipótesis-a-validar)
9. [Usuarios objetivo y jobs to be done](#6-usuarios-objetivo-y-jobs-to-be-done)
10. [Posicionamiento y propuesta de valor](#7-posicionamiento-y-propuesta-de-valor)
11. [Experiencia objetivo y journeys del MVP](#8-experiencia-objetivo-y-journeys-del-mvp)
12. [Requisitos funcionales — producto usuario](#9-requisitos-funcionales--producto-usuario)
13. [Requisitos funcionales — partner, admin y operaciones](#10-requisitos-funcionales--partner-admin-y-operaciones)
14. [Requisitos no funcionales](#11-requisitos-no-funcionales)
15. [Arquitectura de información y modelo de datos mínimo](#12-arquitectura-de-información-y-modelo-de-datos-mínimo)
16. [Instrumentación y analítica](#13-instrumentación-y-analítica)
17. [North Star metric y KPIs de éxito](#14-north-star-metric-y-kpis-de-éxito)
18. [Diseño experimental y plan de validación](#15-diseño-experimental-y-plan-de-validación)
19. [Go-to-market del piloto](#16-go-to-market-del-piloto)
20. [Pagos y transacciones en fase inicial](#17-pagos-y-transacciones-en-fase-inicial)
21. [Riesgos y mitigaciones](#18-riesgos-y-mitigaciones)
22. [Prioridad MoSCoW](#19-prioridad-moscow)
23. [Roadmap sugerido](#20-roadmap-sugerido)
24. [Criterios de salida del MVP](#21-criterios-de-salida-del-mvp)
25. [Recomendación final](#22-recomendación-final)
26. [Base documental y referencias](#23-base-documental-y-referencias)

---

## Objetivo

Validar que los usuarios en Caracas quieren descubrir, comparar y solicitar membresías o pruebas en centros de fitness desde una sola plataforma, y que los centros perciben valor en recibir **leads estructurados y medibles**.

## Tesis de producto

El MVP debe empezar como **marketplace de descubrimiento, comparación y generación de demanda**, con operación simple, pagos locales opcionales y una capa mínima para partners. La reserva y el *check-in* se pilotearán solo donde agreguen aprendizaje claro.

## Resumen ejecutivo

Se recomienda lanzar el MVP de Floit como una **plataforma web mobile-first** enfocada en tres capacidades:

- Buscar gimnasios y centros por zona.
- Comparar opciones de forma estructurada.
- Convertir el interés en una solicitud de suscripción o prueba por un canal rápido (WhatsApp o formulario).

El **checkout completo** y la **suscripción multi-centro** quedan fuera del núcleo del MVP y pasan a una segunda etapa, salvo pilotos controlados con pocos partners.

---

## 1. Contexto y oportunidad

Floit busca validar una oportunidad real: consolidar en una sola experiencia digital la búsqueda, comparación y primer contacto comercial entre usuarios y centros de fitness. El problema a resolver no es solo encontrar gimnasios, sino **reducir la fricción** para entender oferta, precios, ubicación, modalidades y pasos para suscribirse.

La base documental muestra que la oferta regional está fragmentada, la digitalización del consumo sigue creciendo y Venezuela presenta una combinación particular de baja penetración del fitness pago, pagos locales heterogéneos y espacio para una propuesta más confiable y orientada a conversión que un simple directorio.

### Supuestos de contexto que guían el producto

| Elemento | Detalle |
|----------|---------|
| **Mercado** | El fitness pago en LatAm sigue subpenetrado y Venezuela muestra una base pequeña pero con oportunidad de formalización, paquetes flexibles y alianzas. |
| **Oferta** | El *supply* es heterogéneo: *gym floor*, clases con cupo, entrenamiento personal, *functional training*, yoga, pilates y *boxes*. No todos los partners tendrán software de gestión. |
| **Canales** | El comportamiento local favorece *mobile-first*, mensajería y pagos bancarios o mecanismos alternativos al *card-on-file* tradicional. |
| **Posicionamiento** | En esta fase Floit debe ganar por claridad, conveniencia y confianza, no por amplitud extrema ni por complejidad transaccional. |

---

## 2. Visión del producto

Construir la plataforma más confiable para descubrir y activar centros de entrenamiento en Venezuela y, luego, en LatAm. En la fase inicial, Floit será el mejor lugar para que un usuario en Caracas encuentre centros cerca de su zona, los compare con criterio y solicite una suscripción, clase de prueba o contacto comercial en minutos.

La visión de largo plazo es evolucionar desde *discovery* y generación de leads hacia marketplace transaccional, suscripción multi-centro, programa corporativo y servicios adyacentes de wellness y longevidad.

---

## 3. Objetivo del MVP y objetivos secundarios

| Elemento | Detalle |
|----------|---------|
| **Objetivo principal** | Validar que usuarios en Caracas usan una experiencia unificada para buscar, comparar y solicitar una suscripción o prueba en centros de fitness. |
| **Objetivo secundario 1** | Validar que los centros perciben valor en recibir leads estructurados, medibles y de alta intención. |
| **Objetivo secundario 2** | Identificar las variables de comparación que más empujan conversión: ubicación, precio, tipo de disciplina, horarios, *amenities*, reputación y promociones. |
| **Objetivo secundario 3** | Aprender qué canal cierra mejor la conversión inicial: WhatsApp, llamada, formulario, solicitud de prueba o reserva de *day-pass*. |
| **Objetivo secundario 4** | Preparar la arquitectura operativa y de datos para pasar después a reserva, *check-in* y monetización más avanzada sin rehacer la base. |

---

## 4. Alcance del MVP

El MVP se define como una **prueba de concepto operativa** para Caracas o Distrito Capital. No busca replicar desde el día uno a ClassPass o Wellhub, sino validar la demanda, capturar aprendizajes y dejar preparada la base para una fase transaccional posterior.

Se trabajará con una mezcla de gimnasios tradicionales, *boxes* de *functional training* y estudios de yoga, pilates, *cycling* o entrenamiento personalizado. Se priorizarán zonas con mayor densidad y probabilidad de adopción digital.

### In scope, out of scope y decisiones de simplificación

| Bloque | Incluido en MVP | Fuera de alcance inicial | Razón |
|--------|-----------------|---------------------------|-------|
| **Discovery** | Mapa y lista, filtros, fichas, comparador, favoritos | Cobertura nacional completa | Primero se necesita densidad local y calidad de datos. |
| **Conversión** | Formulario, WhatsApp, llamada y solicitud de prueba o suscripción | *Checkout* multi-centro completo para todos los partners | Reduce complejidad regulatoria, de pagos y de soporte. |
| **Partner** | Panel *lite* para leads, perfil y datos básicos | ERP completo o facturación avanzada | El objetivo es validar demanda, no reemplazar su software. |
| **Reserva** | Piloto selectivo para pruebas o *day-pass* en pocos partners | Reserva universal y sincronización compleja para toda la red | Se reserva para fase posterior o piloto controlado. |
| **Pagos** | Opcional y acotado a pilotos con *rails* locales y bajo riesgo | *Wallet* propia o *split* marketplace automatizado en Venezuela | El contexto local recomienda prudencia y bajo acoplamiento. |

---

## 5. Hipótesis a validar

El PRD se centra en hipótesis de producto, demanda y operación. Todas deben traducirse a experimentos medibles en un piloto de **8 a 12 semanas**.

### Hipótesis clave

| ID | Hipótesis | Métrica de validación | Criterio de éxito inicial |
|----|-----------|------------------------|---------------------------|
| **H1** | Los usuarios valoran una experiencia única para comparar centros mejor que buscar uno por uno en Instagram o Google. | Uso del comparador y tiempo hasta contacto | ≥ 20% de usuarios que llegan a fichas usan comparador o favoritos. |
| **H2** | La propuesta de valor principal en Caracas es reducir fricción de decisión, no necesariamente pagar dentro de la app. | Conversión ficha → lead | ≥ 8% de sesiones con vista de ficha generan una solicitud de contacto. |
| **H3** | WhatsApp supera a email y formularios largos como canal de cierre inicial. | *Share* de leads por canal y tasa de respuesta | WhatsApp genera ≥ 50% de leads y mejor tasa de respuesta que los otros canales. |
| **H4** | Los partners actualizarán su perfil si reciben leads útiles y feedback de demanda. | Tasa de activación de partner y completitud de perfil | ≥ 70% de partners activos mantienen ficha completa y actualizada. |
| **H5** | Agregar solicitud de clase de prueba o *day-pass* aumenta conversión frente a solo solicitar membresía. | *Lift* de conversión por CTA | CTA de prueba mejora conversión ≥ 20% vs CTA solo de membresía. |
| **H6** | Una experiencia premium de datos y confianza permite luego introducir reserva y *check-in* en un subconjunto de *venues*. | Participación en piloto de reserva | 10–15 partners aceptan piloto transaccional luego del primer ciclo. |

> **Decisiones de producto derivadas de las hipótesis:** el MVP no se medirá por descargas ni por MAU aislado. Se medirá por calidad del *matching*, uso del comparador, volumen de leads calificados, velocidad de respuesta del partner y conversión a conversación comercial o prueba.

---

## 6. Usuarios objetivo y jobs to be done

El producto debe servir a **dos lados del marketplace**. En esta etapa la prioridad es maximizar el aprendizaje de ambos, no escalar volumen a cualquier costo.

### Segmentos prioritarios

| Segmento | Necesidad principal | Qué valoran | Implicación para MVP |
|----------|---------------------|-------------|------------------------|
| **Explorador urbano** | Encontrar opciones varias cerca de su rutina | Ubicación, variedad, fotos, precio orientativo, modalidad | Comparador y filtros fuertes desde el día uno. |
| **Buscador pragmático** | Conseguir gimnasio funcional y accesible rápido | Proximidad, horario, *amenities*, promociones, contacto directo | Ficha clara y CTA corto de solicitud. |
| **Boutique / experiencia** | Elegir estudio por disciplina, coach y experiencia | Calidad visual, reputación, horarios, clases y comunidad | Fichas ricas y posibilidad de prueba. |
| **Partner premium o estudio** | Recibir demanda incremental sin fricción operativa | Leads útiles, control del perfil, rapidez de contacto, *reporting* | Partner panel *lite* y SLA de leads. |
| **Partner tradicional** | Aparecer en digital sin montar equipo propio | Simplicidad de *onboarding*, WhatsApp, soporte humano | Operación asistida y *backoffice* fuerte. |

---

## 7. Posicionamiento y propuesta de valor

| Audiencia | Mensaje |
|-----------|---------|
| **Usuario** | «Encuentra y compara los mejores centros de entrenamiento cerca de ti, revisa información clara y solicita tu plan o prueba en minutos». |
| **Partner** | «Gana visibilidad, recibe leads estructurados y mide demanda real sin depender solo de Instagram o mensajes desordenados». |

### Propuesta de valor por lado

| Elemento | Detalle |
|----------|---------|
| **Usuario** | Búsqueda geolocalizada, comparación estructurada, información útil y un camino de contacto rápido y confiable. |
| **Partner** | Visibilidad, leads con contexto, panel simple, *reporting* básico y soporte de *onboarding*. |
| **Floit** | Aprendizaje de demanda, taxonomía de oferta local, capacidad de priorizar categorías y base para monetización posterior. |

---

## 8. Experiencia objetivo y journeys del MVP

El *journey* principal debe poder completarse en **menos de cinco minutos** desde la primera visita hasta una solicitud enviada. La experiencia debe ser web *mobile-first* con rendimiento rápido, buscador prominente y CTAs visibles.

### Journey principal — usuario

| Elemento | Detalle |
|----------|---------|
| **Paso 1** | Llega a Floit por anuncios, SEO, referido o contenido y permite ubicación o selecciona zona manualmente. |
| **Paso 2** | Explora lista y mapa con filtros: disciplina, precio, distancia, horario, *amenities*, tipo de centro y promociones. |
| **Paso 3** | Abre fichas, guarda favoritos y compara hasta 3 o 4 centros lado a lado. |
| **Paso 4** | Selecciona CTA: solicitar membresía, pedir prueba, contactar por WhatsApp o agendar llamada. |
| **Paso 5** | Completa formulario corto con nombre, zona, disciplina de interés, presupuesto y horario preferido. |
| **Paso 6** | Recibe confirmación inmediata y seguimiento por partner o por Floit según el modelo de operación. |

### Journey principal — partner

| Elemento | Detalle |
|----------|---------|
| **Paso 1** | *Onboarding* asistido o *self-serve* para crear o reclamar perfil. |
| **Paso 2** | Carga datos básicos: dirección, geolocalización, modalidades, fotos, precios orientativos, planes y horarios. |
| **Paso 3** | Recibe leads en panel, email y/o WhatsApp con trazabilidad. |
| **Paso 4** | Marca estado del lead: nuevo, contactado, prueba agendada, ganado, perdido. |
| **Paso 5** | Consulta métricas básicas: vistas, comparaciones, leads, tasa de respuesta. |

---

## 9. Requisitos funcionales — producto usuario

Los requisitos funcionales se organizan por módulo y prioridad. La regla general es priorizar funciones que aumenten **confianza, comparabilidad y conversión**.

### Módulo 1: Discovery y exploración

| ID | Requisito | Descripción | Prioridad | Notas |
|----|-----------|-------------|-----------|-------|
| RF-01 | Búsqueda por ubicación | Ubicación actual, zona o dirección manual. | Must | Debe funcionar sin login. |
| RF-02 | Lista y mapa | Vista lista y vista mapa con *pins* geolocalizados. | Must | Mapa simple; *cluster* en alta densidad. |
| RF-03 | Filtros | Disciplina, tipo de centro, rango de precio, horario, distancia, *amenities* y promociones. | Must | Los filtros más usados deben verse arriba. |
| RF-04 | Ordenación | Cercanía, relevancia, popularidad, precio y disponibilidad de prueba. | Should | Relevancia se afinará con datos. |
| RF-05 | Favoritos | Favoritos y guardado de comparaciones. | Should | Sin login usando almacenamiento local; con login se sincroniza. |

### Módulo 2: Ficha del centro

| ID | Requisito | Descripción | Prioridad | Notas |
|----|-----------|-------------|-----------|-------|
| RF-06 | Información base | Nombre, fotos, dirección, zonas cercanas, horarios, modalidades y *amenities*. | Must | Contenido estandarizado. |
| RF-07 | Precio | Precio referencial o rango de planes, con campo de «consultar precio» si el partner no publica precio exacto. | Must | Evita fichas vacías. |
| RF-08 | Copy | Descripción corta del centro, diferenciales y público objetivo. | Should | Reduce dependencia del copy del partner. |
| RF-09 | Reseñas / rating | Reviews o rating curado por Floit en MVP, con apertura posterior a UGC moderado. | Could | Puede empezar como rating editorial. |
| RF-10 | CTAs | Solicitar membresía, pedir clase de prueba, WhatsApp, llamar. | Must | Cada CTA debe ser medible. |

### Módulo 3: Comparador

| ID | Requisito | Descripción | Prioridad | Notas |
|----|-----------|-------------|-----------|-------|
| RF-11 | Comparación | Comparar hasta 4 centros en una tabla clara. | Must | Móvil: *cards* apiladas; escritorio: tabla. |
| RF-12 | Campos | Distancia, precio, disciplinas, horario, *amenities*, nivel, tipo de acceso, promociones y CTA. | Must | La normalización de taxonomía es crítica. |
| RF-13 | Destacados | Resaltar diferencias y *best fit* según criterio elegido por usuario. | Should | Ej.: más cercano, mejor precio, más modalidades. |
| RF-14 | Compartir | Permitir compartir comparación por enlace o captura. | Could | Útil para decisión social. |

### Módulo 4: Conversión y solicitud

| ID | Requisito | Descripción | Prioridad | Notas |
|----|-----------|-------------|-----------|-------|
| RF-15 | Formulario | Nombre, teléfono, email opcional, disciplina, presupuesto y horario. | Must | Menos de 6 campos visibles. |
| RF-16 | WhatsApp | CTA directo a WhatsApp con mensaje prellenado y *tracking*. | Must | Canal principal para Venezuela. |
| RF-17 | Tipos de solicitud | Membresía, prueba, *day-pass*, llamada, información. | Must | Sirve para clasificar intención. |
| RF-18 | Confirmación | Confirmación de envío y expectativa de respuesta. | Must | Reduce ansiedad del usuario. |
| RF-19 | *Handoff* | Si el partner no responde, Floit puede hacer *handoff* asistido o reasignar seguimiento. | Should | Operación manual soportada desde admin. |

---

## 10. Requisitos funcionales — partner, admin y operaciones

Sin una capa mínima para *supply*, el producto se convierte en directorio desactualizado. El partner panel y el *backoffice* son parte del MVP, no extras.

### Módulo 5: Partner panel *lite*

| ID | Requisito | Descripción | Prioridad | Notas |
|----|-----------|-------------|-----------|-------|
| RF-20 | Acceso | Login o acceso seguro para partner. | Must | Puede empezar con *magic link*. |
| RF-21 | Perfil | Edición de perfil, fotos, datos, horarios, planes y CTAs activos. | Must | Con validación por Floit. |
| RF-22 | Leads | Bandeja de leads y estados del embudo. | Must | *Lead ownership* visible. |
| RF-23 | Métricas | Vistas, comparaciones, leads, tasa de respuesta. | Should | Simple y accionable. |
| RF-24 | Respuesta | Plantillas de respuesta o integración simple con WhatsApp Business. | Should | Acelera seguimiento. |

### Módulo 6: Admin y operaciones Floit

| ID | Requisito | Descripción | Prioridad | Notas |
|----|-----------|-------------|-----------|-------|
| RF-25 | CMS | Alta, aprobación, edición y desactivación de centros. | Must | Soporta operación asistida. |
| RF-26 | Taxonomía | Modalidades, *amenities*, tipos de plan y zonas. | Must | Base para comparación y analítica. |
| RF-27 | *Lead router* | Enrutamiento de leads y monitoreo de SLA por partner. | Must | Clave para calidad del marketplace. |
| RF-28 | Auditoría | Bitácora de cambios y auditoría de fichas. | Should | Asegura trazabilidad. |
| RF-29 | Datos | Export de datos y *dashboard* de analítica. | Must | CSV y tablero operativo. |

### Módulo 7: Piloto transaccional opcional

| ID | Requisito | Descripción | Prioridad | Notas |
|----|-----------|-------------|-----------|-------|
| RF-30 | Reserva | Reserva de prueba o *day-pass* en 5 a 15 *venues* piloto. | Could | No bloquea lanzamiento del MVP core. |
| RF-31 | Disponibilidad | Simple por bloques o cupos manuales. | Could | Sin integraciones complejas al inicio. |
| RF-32 | *Check-in* | Mediante QR o PIN en piloto selectivo. | Could | Solo si genera aprendizaje fuerte. |
| RF-33 | Cobro | Simple por *rail* local o pago directo al *venue*. | Could | Manual o semi manual para evitar sobrecarga. |

> **Recomendación de alcance:** el MVP debe lanzar con *discovery*, comparación y captura de leads como núcleo. Reserva, *check-in* y pagos se habilitan solo en pilotos de alto aprendizaje, para no convertir la prueba de concepto en un proyecto operativo sobredimensionado.

---

## 11. Requisitos no funcionales

La percepción de calidad de Floit dependerá mucho de velocidad, claridad visual y confiabilidad de datos.

| ID | Elemento | Detalle |
|----|----------|---------|
| RNF-01 | **Rendimiento** | LCP objetivo menor a 2,5 s en móvil 4G; experiencia web responsiva y ligera. |
| RNF-02 | **Mobile-first** | Toda experiencia principal optimizada para smartphones; web app responsive antes que app nativa. |
| RNF-03 | **Seguridad** | HTTPS, control de accesos por rol, *hash* de credenciales, *audit log* en acciones de partner y admin. |
| RNF-04 | **Privacidad** | Consentimiento claro para contacto y ubicación; minimización de datos; política de privacidad visible. |
| RNF-05 | **Observabilidad** | Eventos medibles en buscador, filtros, comparador, CTA, formulario y respuesta del partner. |
| RNF-06 | **Calidad de datos** | Campos obligatorios por ficha, *score* de completitud e indicador de última actualización. |
| RNF-07 | **Soporte operativo** | *Fallback* manual para editar fichas, cargar leads y resolver casos en menos de 1 día hábil. |

---

## 12. Arquitectura de información y modelo de datos mínimo

Para que el comparador funcione bien, Floit necesita una taxonomía consistente. La entidad «venue» debe normalizar información que hoy suele estar dispersa en redes sociales o mensajes.

### Entidades mínimas

| Entidad | Campos / descripción |
|---------|----------------------|
| **Venue** | `id`, nombre, tipo, descripción corta, dirección, lat, lng, zona, estado de activación, *score* de completitud. |
| **Offering** | Modalidades, tipo de acceso, horarios, *amenities*, rango de precio, promociones, disponibilidad de prueba. |
| **Partner account** | Contactos, SLA, canales habilitados, estado de *onboarding*, responsable comercial. |
| **Lead** | Fuente, CTA, datos de usuario, centro solicitado, estado, marcas de tiempo, motivo de perdida o ganada. |
| **Comparison event** | Centros comparados, criterios vistos, resultado del *journey*. |
| **Optional booking** | Slot, tipo de prueba, estado, *check-in*, método de validación. |

---

## 13. Instrumentación y analítica

La medición debe cubrir todo el embudo. Sin esto, Floit correrá el riesgo de leer tráfico como validación cuando el objetivo real es **conversión y calidad del matching**.

### Eventos y métricas principales

| Nivel | Evento o KPI | Definición | Uso |
|-------|--------------|------------|-----|
| **Adquisición** | Landing view / source / campaign | Origen de cada visita y sesión. | Optimizar canales y costo por lead. |
| **Discovery** | Search executed / filter applied / map interaction | Uso real de buscador, filtros y mapa. | Identificar variables de valor. |
| **Decisión** | Profile viewed / compare started / compare completed / favorite added | Profundidad de evaluación. | Medir fricción y utilidad del comparador. |
| **Conversión** | CTA clicked / lead submitted / WhatsApp opened / call initiated | Intención comercial. | Núcleo del MVP. |
| **Partner ops** | Lead accepted / contacted / trial scheduled / won / lost | Estado del embudo partner. | Medir utilidad del producto para *supply*. |
| **Marketplace quality** | Response SLA / profile freshness / data completeness | Confiabilidad operativa. | Evitar degradación de la experiencia. |

---

## 14. North Star metric y KPIs de éxito

La *North Star* del MVP no debe ser membresías vendidas directamente, porque el producto todavía opera como *discovery* + generación de leads. La métrica principal debe reflejar **matching útil y conversión real**.

### Métricas de éxito recomendadas

| Rol | Métrica |
|-----|---------|
| **North Star Metric** | **Qualified Intent Requests (QIR):** solicitudes válidas de membresía, prueba o contacto enviadas a partners. |
| **KPI 1** | *Search-to-profile rate:* porcentaje de sesiones que pasan de exploración a ficha. |
| **KPI 2** | *Profile-to-lead rate:* porcentaje de fichas vistas que generan una solicitud. |
| **KPI 3** | *Compare adoption:* porcentaje de sesiones con uso del comparador. |
| **KPI 4** | *Partner response SLA:* porcentaje de leads atendidos dentro de la ventana prometida. |
| **KPI 5** | *Lead-to-trial or sales conversation rate:* porcentaje de leads que terminan en contacto real o prueba agendada. |
| **KPI 6** | *Partner retention in pilot:* porcentaje de *venues* que se mantienen activos al cierre del piloto. |

### Targets iniciales para un piloto de 8 a 12 semanas

| KPI | Meta mínima | Meta aspiracional | Interpretación |
|-----|-------------|-------------------|----------------|
| Venues activos | 40 | 70 | Bajo 40 no hay suficiente densidad para aprender bien. |
| Completitud de ficha | 70% | 85% | Debajo de esto el comparador pierde valor. |
| Uso del comparador | 15% | 25% | Valida diferenciación vs directorio simple. |
| Profile-to-lead | 8% | 12% | Umbral para validar interés comercial real. |
| Respuesta partner en menos de 2 h hábiles | 50% | 70% | La experiencia depende del seguimiento. |
| Lead a prueba o conversación | 25% | 40% | Indica calidad del lead y del *matching*. |

---

## 15. Diseño experimental y plan de validación

El MVP debe operar como producto y como experimento. Se proponen **tres oleadas** de aprendizaje:

1. **Oleada 1 — Discovery:** lanzar catálogo curado con fuerte instrumentación y observar qué filtros, zonas y categorías concentran más interés.
2. **Oleada 2 — Decisión:** introducir comparador y distintas versiones de ficha para medir *lift* en conversión.
3. **Oleada 3 — Conversión:** probar CTAs, flujos de WhatsApp, formularios cortos y solicitud de prueba. En pocos partners, pilotear reserva o *day-pass*.

### Experimentos recomendados

| ID | Experimento |
|----|-------------|
| EXP-01 | Precio visible vs «consultar precio» en ficha. |
| EXP-02 | CTA principal «Solicitar membresía» vs «Pedir prueba». |
| EXP-03 | Comparador con tabla completa vs resumen de mejores diferencias. |
| EXP-04 | WhatsApp directo vs formulario con *handoff* posterior. |
| EXP-05 | *Landing* por zona: Chacao, Baruta, El Hatillo, Libertador y Las Mercedes como clusters de prueba. |
| EXP-06 | *Badge* editorial de recomendación Floit vs ficha neutral. |

---

## 16. Go-to-market del piloto

El producto necesita **densidad** y no una red gigantesca. La recomendación es empezar con una curación fuerte y un *city playbook* claro.

### Plan comercial y de *supply*

| Elemento | Detalle |
|----------|---------|
| **Cobertura geográfica** | Empezar con Caracas y Distrito Capital, priorizando zonas de alta densidad y poder adquisitivo medio y medio-alto. |
| **Categorías prioritarias** | Gimnasio tradicional, *functional training*, *cross-training*, yoga, pilates, *cycling* y entrenamiento personalizado. |
| **Meta de onboarding** | 40 a 70 *venues* activos en 8 a 12 semanas con al menos 70% de fichas completas. |
| **Adquisición de usuarios** | *Performance* local, alianzas con *creators* fitness, referidos, SEO local y contenido comparativo por zonas. |
| **Adquisición de partners** | *Onboarding* asistido, promesa de visibilidad y leads, fee de lanzamiento bajo o cero en piloto. |

---

## 17. Pagos y transacciones en fase inicial

Dado el contexto venezolano y la no disponibilidad local de ciertos PSP globales, el MVP **no debe depender** de pagos automatizados complejos para validar el concepto. El producto debe ser compatible con *rails* locales y con una etapa de *handoff* comercial.

Si se decide probar cobro para *day-pass* o prueba paga, se recomienda hacerlo en un subpiloto con proceso manual o semi manual y conciliación acotada, evitando *wallet* propia o *split* complejo.

### Principios de pagos MVP

| Principio | Detalle |
|-----------|---------|
| **1** | No custodiar fondos innecesariamente durante el piloto. |
| **2** | Priorizar *handoff* comercial y pago directo al partner cuando el aprendizaje principal es demanda. |
| **3** | Usar *rails* locales y procesos simples para pilotos de pago. |
| **4** | Separar desde la arquitectura el módulo de pagos para poder cambiar proveedor o país después. |

---

## 18. Riesgos y mitigaciones

Los principales riesgos del MVP no son solo tecnológicos: son, sobre todo, **calidad de datos**, **velocidad de respuesta** y **sobrecarga operativa**.

| Riesgo | Impacto | Mitigación | Owner inicial |
|--------|---------|------------|---------------|
| Datos desactualizados | Alta frustración y pérdida de confianza | Curación inicial, *score* de frescura, recordatorios a partner y *backoffice* de QA | Ops + Partner success |
| Poca densidad de oferta | Comparador poco útil | Lanzar por zonas y categorías prioritarias antes de expandir cobertura | CEO + Growth |
| Baja respuesta del partner | Leads desperdiciados | SLA, alertas y modelo de *handoff* asistido | Partner success |
| Complejidad de pagos | Retrasos de lanzamiento | Mantener pagos fuera del núcleo del MVP y hacer pilotos controlados | Producto + Finanzas |
| Sobreconstrucción del producto | Dilución del aprendizaje | MoSCoW estricto y release en dos capas: núcleo y piloto opcional | Producto |

---

## 19. Prioridad MoSCoW

La siguiente tabla resume el alcance recomendado para el primer release y el *backlog* inmediato posterior.

| Must have | Should have | Could have | Won't have (ahora) |
|-----------|-------------|------------|---------------------|
| Búsqueda por zona, lista/mapa, filtros, ficha de centro, comparador, favoritos, CTA de WhatsApp/formulario, partner panel *lite*, admin CMS, analítica de embudo. | *Landing* por zonas, *score* editorial, reseñas moderadas, métricas para partner, integración simple con WhatsApp Business. | Reserva de prueba, *day-pass*, QR o PIN piloto, promociones y cupones, *onboarding self-serve* total. | Suscripción multi-centro completa, *billing* recurrente complejo, *wallet* propia, programa corporativo completo, app nativa *full*. |

---

## 20. Roadmap sugerido

El roadmap se alinea con una prueba de concepto controlada y aprendizaje semanal.

| Elemento | Detalle |
|----------|---------|
| **Mes 1** | Investigación de campo, taxonomía de datos, adquisición de primeros partners, definición de CTAs y copy. |
| **Mes 2** | Construcción del MVP web, CMS admin, fichas, mapa, filtros, comparador y *tracking* básico. |
| **Mes 3** | Partner panel *lite*, lanzamiento beta, operación asistida, mejora continua de calidad de datos. |
| **Mes 4** | Optimizar conversión, correr experimentos de CTA, instrumentación y SLA de seguimiento. |
| **Mes 5** | Subpiloto de prueba o *day-pass* con pocos partners y pagos simples si procede. |
| **Mes 6** | *Decision gate:* pasar a fase transaccional, suscripción limitada o expansión de ciudad. |

---

## 21. Criterios de salida del MVP

Al cerrar el piloto, Floit debe tomar una decisión basada en evidencia:

- **Go a Fase 2** si el producto demuestra conversión sana, partners comprometidos y suficiente densidad.
- **Iterar *discovery*** si hay tráfico pero bajo uso del comparador o baja conversión a lead.
- **Pivotear propuesta de valor** si el problema dominante resulta ser solo *lead gen* para partners o solo *discovery* editorial para usuarios.
- **No pasar a pagos o suscripción multi-centro** si la calidad de respuesta y el *matching* aún no están resueltos.

---

## 22. Recomendación final

La mejor prueba de concepto para Floit **no es un clon prematuro de ClassPass**. Es un producto centrado en *discovery*, comparación y activación comercial con excelente calidad de datos y una operación local muy bien resuelta.

Si Floit gana en Caracas en claridad, velocidad y confianza, estará en posición de agregar reserva, *check-in*, *day-passes*, suscripción multi-centro y, después, corporativo y servicios de wellness o longevidad. Si intenta lanzar todo desde el inicio, el riesgo es **aprender poco y tardar demasiado**.

> **Decisión recomendada:** lanzar el MVP de Floit como *discovery* + comparación + *lead marketplace*, con un piloto transaccional pequeño y optativo. Este enfoque valida las hipótesis más importantes con menor riesgo técnico, regulatorio y operativo.

---

## 23. Base documental y referencias

Este PRD se construye a partir de la investigación entregada por el equipo y de verificación puntual de restricciones de pagos locales.

1. Análisis de mercado profundo: plataforma agregadora tipo Uber para gimnasios/centros de entrenamiento en Venezuela y América Latina.
2. Modelos de negocio y mejores prácticas para un marketplace tipo Uber de gimnasios en Venezuela y Latinoamérica.
3. *Global and LatAm Benchmarks for a Fitness/Wellness Venue Aggregator (Uber for Gyms) in Venezuela & LatAm.*
4. *Global Fitness Venue Marketplaces Benchmark and Product/Tech Strategy Base for Venezuela and Latin America.*

**Verificación puntual adicional:** Stripe global availability, Pagomóvil BDV y Banesco Pagos.
