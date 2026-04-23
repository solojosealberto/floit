# Backlog de producto — MVP Floit

| Campo | Valor |
| --- | --- |
| **Producto** | Floit |
| **Alcance geográfico inicial** | Caracas |
| **Enfoque** | MVP: discovery, comparación y generación de leads / transacción asistida |
| **Fuera de alcance inicial** | Suscripción multi‑centro plena, reservas complejas, check‑in universal, capas profundas de pagos e integraciones |

## Resumen ejecutivo

Este documento define el backlog de producto del MVP de Floit alineado con los documentos base: comenzar en Caracas con un MVP centrado en *discovery*, comparación y generación de leads o transacción asistida; las capacidades más avanzadas quedan para fases posteriores.

---

## Tabla de contenidos

1. [Convenciones del backlog](#convenciones-del-backlog)
2. [Épicas e historias de usuario](#epicas-e-historias-de-usuario)
3. [Priorización sugerida por release](#priorizacion-por-release)
4. [Definición de Done recomendada](#definicion-de-done-recomendada)
5. [Hipótesis que este backlog ayuda a validar](#hipotesis-de-validacion)

---

<a id="convenciones-del-backlog"></a>

## Convenciones del backlog

### Formato de historia

> Como `[tipo de usuario]`, quiero `[objetivo]`, para `[resultado]`.

### Prioridades

| Nivel | Descripción |
| --- | --- |
| **P0** | Imprescindible para validar el MVP |
| **P1** | Importante para fortalecer validación y comercialización |
| **P2** | Valioso, pero diferible a post‑MVP |

### Buenas prácticas aplicadas

- Historias pensadas para ser **INVEST**
- Criterios de aceptación en estilo **Given / When / Then** simplificado
- Separación entre **producto**, **operación** y **enablers técnicos**
- Priorización enfocada en validar hipótesis, no en construir el producto final

---

<a id="epicas-e-historias-de-usuario"></a>

## Épicas e historias de usuario

### Epic 1 — Descubrimiento y búsqueda de gimnasios en Caracas

**Objetivo:** permitir que un usuario encuentre centros relevantes según ubicación, modalidad y necesidades básicas.

#### US-1.1 Búsqueda por zona o ubicación

| Campo | Detalle |
| --- | --- |
| **ID** | US-1.1 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero buscar gimnasios por zona en Caracas o por cercanía, para encontrar opciones relevantes cerca de mí. |

**Criterios de aceptación**

- Dado que el usuario entra al buscador, cuando selecciona una zona o permite ubicación, entonces ve resultados ordenados por cercanía o relevancia.
- Dado que no comparte ubicación, cuando escribe una zona o municipio, entonces el sistema devuelve resultados asociados a esa zona.
- Dado que no existen resultados exactos, cuando realiza una búsqueda, entonces el sistema muestra opciones cercanas o zonas relacionadas.
- Dado que la búsqueda fue ejecutada, cuando se muestran resultados, entonces cada resultado incluye nombre, zona, modalidad principal y CTA principal.

#### US-1.2 Filtros básicos de búsqueda

| Campo | Detalle |
| --- | --- |
| **ID** | US-1.2 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero filtrar gimnasios por atributos clave, para acotar mi búsqueda a lo que realmente me interesa. |

**Criterios de aceptación**

- Dado que estoy en la lista de resultados, cuando aplico filtros, entonces la lista se actualiza sin perder el contexto.
- Dado que existen filtros activos, cuando regreso al listado, entonces los filtros permanecen aplicados durante la sesión.
- Los filtros mínimos deben incluir: zona, tipo de centro, rango de precio, modalidades, horario, amenities clave.
- Debe existir una acción para limpiar todos los filtros.

#### US-1.3 Vista lista y mapa

| Campo | Detalle |
| --- | --- |
| **ID** | US-1.3 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero ver los gimnasios en lista y en mapa, para decidir más rápido según conveniencia geográfica. |

**Criterios de aceptación**

- Dado que hay resultados, cuando alterno entre vista lista y mapa, entonces veo el mismo universo de resultados.
- Dado que selecciono un marcador en el mapa, cuando hago clic, entonces veo un resumen del gimnasio y un enlace a su perfil.
- Dado que selecciono una tarjeta en lista, cuando la abro, entonces el mapa resalta su ubicación.
- La interfaz debe ser usable en móvil.

#### US-1.4 Resultados ordenados por relevancia

| Campo | Detalle |
| --- | --- |
| **ID** | US-1.4 |
| **Prioridad** | P1 |
| **Historia** | Como usuario, quiero que Floit me muestre primero las mejores opciones, para reducir tiempo de decisión. |

**Criterios de aceptación**

- Dado que realizo una búsqueda, cuando veo resultados, entonces el orden por defecto considera cercanía, completitud del perfil y coincidencia con filtros.
- Debe existir opción para ordenar por precio, distancia y popularidad interna.
- El sistema debe evitar mostrar perfiles incompletos por encima de perfiles completos salvo que la coincidencia geográfica lo justifique.

---

### Epic 2 — Perfil del gimnasio y benchmark / comparación

**Objetivo:** estandarizar la información del *supply* para que el usuario pueda evaluar opciones con confianza.

#### US-2.1 Perfil detallado del gimnasio

| Campo | Detalle |
| --- | --- |
| **ID** | US-2.1 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero ver la ficha completa de un gimnasio, para evaluar si se ajusta a mis necesidades. |

**Criterios de aceptación**

- Dado que ingreso a una ficha, cuando la visualizo, entonces veo nombre, ubicación, fotos, horarios, modalidades, amenities, rango de precios y canales de contacto.
- Dado que el partner cargó planes, cuando veo la ficha, entonces puedo visualizar tipos de membresía o planes disponibles.
- Dado que el gimnasio tiene múltiples sedes, cuando veo la ficha, entonces se indica claramente la sede mostrada.
- Debe existir un CTA visible para contactar o solicitar suscripción.

#### US-2.2 Comparador entre gimnasios

| Campo | Detalle |
| --- | --- |
| **ID** | US-2.2 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero comparar varios gimnasios lado a lado, para tomar una mejor decisión. |

**Criterios de aceptación**

- Dado que estoy navegando perfiles o resultados, cuando agrego gimnasios a comparar, entonces puedo comparar hasta 3 al mismo tiempo.
- Dado que abro el comparador, cuando se muestran los gimnasios, entonces veo una tabla estandarizada con precio, ubicación, modalidades, horarios y amenities.
- Dado que un campo no esté disponible, cuando se muestra la comparación, entonces se indica como «no informado».
- Debe ser posible remover un gimnasio del comparador sin perder los demás.

#### US-2.3 Badges de valor y benchmark rápido

| Campo | Detalle |
| --- | --- |
| **ID** | US-2.3 |
| **Prioridad** | P1 |
| **Historia** | Como usuario, quiero ver señales rápidas de valor, para decidir sin leer toda la ficha. |

**Criterios de aceptación**

- El sistema puede mostrar badges como «Más cercano», «Mejor rango de precio», «Más completo», «Abierto ahora», si hay datos suficientes.
- Dado que no hay datos suficientes, cuando el badge no puede calcularse, entonces no se muestra.
- Los badges deben basarse en reglas transparentes definidas por producto y no en datos inventados.

#### US-2.4 Favoritos

| Campo | Detalle |
| --- | --- |
| **ID** | US-2.4 |
| **Prioridad** | P1 |
| **Historia** | Como usuario, quiero guardar gimnasios favoritos, para revisarlos luego. |

**Criterios de aceptación**

- Dado que veo un gimnasio, cuando selecciono guardar, entonces el gimnasio queda en mi lista de favoritos.
- Dado que regreso a la plataforma, cuando estoy autenticado o identificado, entonces puedo recuperar mis favoritos.
- Debe existir una vista de favoritos con acceso directo a comparación y contacto.

---

### Epic 3 — Contacto y solicitud de suscripción

**Objetivo:** convertir *discovery* en intención comercial medible.

#### US-3.1 Solicitud de información o suscripción

| Campo | Detalle |
| --- | --- |
| **ID** | US-3.1 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero enviar una solicitud de suscripción o información a un gimnasio, para iniciar el proceso comercial. |

**Criterios de aceptación**

- Dado que estoy en la ficha de un gimnasio, cuando hago clic en «Solicitar suscripción» o equivalente, entonces veo un formulario corto.
- El formulario mínimo incluye nombre, teléfono, correo opcional, preferencia de horario, interés principal y comentario opcional.
- Dado que el envío fue exitoso, cuando se procesa la solicitud, entonces el usuario ve confirmación clara.
- Dado que falta información obligatoria, cuando intenta enviar, entonces el sistema valida y muestra errores.

#### US-3.2 Contacto directo por WhatsApp / llamada / correo

| Campo | Detalle |
| --- | --- |
| **ID** | US-3.2 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero contactar al gimnasio de forma inmediata, para acelerar la conversión. |

**Criterios de aceptación**

- Dado que el gimnasio tiene canales configurados, cuando veo su ficha, entonces aparecen CTA de WhatsApp, llamada o email según disponibilidad.
- Dado que hago clic en WhatsApp, cuando se abre el canal, entonces el mensaje puede incluir contexto mínimo del gimnasio consultado.
- Dado que el partner no configuró un canal, cuando veo la ficha, entonces ese CTA no se muestra.

#### US-3.3 Confirmación y seguimiento básico de la solicitud

| Campo | Detalle |
| --- | --- |
| **ID** | US-3.3 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero saber que mi solicitud fue registrada, para no sentir incertidumbre. |

**Criterios de aceptación**

- Dado que envié una solicitud, cuando finaliza el envío, entonces veo mensaje de confirmación y próximos pasos.
- Dado que dejé correo o teléfono, cuando la plataforma tenga habilitado el canal, entonces se puede enviar confirmación automática.
- La solicitud debe quedar registrada en backoffice con fecha, hora, gimnasio y canal.

#### US-3.4 Agendar visita o prueba

| Campo | Detalle |
| --- | --- |
| **ID** | US-3.4 |
| **Prioridad** | P1 |
| **Historia** | Como usuario, quiero solicitar una visita o clase de prueba, para reducir fricción antes de suscribirme. |

**Criterios de aceptación**

- Dado que el gimnasio habilita esta opción, cuando el usuario la selecciona, entonces puede dejar su preferencia de fecha y hora.
- Dado que la opción no está habilitada para un gimnasio, cuando el usuario entra a la ficha, entonces no se muestra ese CTA.
- El lead debe quedar marcado como «visita/prueba» en el CRM o backoffice.

#### US-3.5 Estado del lead

| Campo | Detalle |
| --- | --- |
| **ID** | US-3.5 |
| **Prioridad** | P1 |
| **Historia** | Como usuario, quiero poder ver si mi solicitud fue recibida o atendida, para tener visibilidad del proceso. |

**Criterios de aceptación**

- Dado que existe una solicitud registrada, cuando el estado cambia en backoffice, entonces puede reflejarse como «recibida», «en contacto», «cerrada».
- Dado que el MVP no incluya login robusto, cuando no sea posible exponer el estado al usuario final, entonces al menos debe estar disponible para operación interna.

---

### Epic 4 — Onboarding y autoservicio básico para partners

**Objetivo:** permitir que gimnasios participen y mantengan información mínima actualizada.

#### US-4.1 Alta o claim de perfil de gimnasio

| Campo | Detalle |
| --- | --- |
| **ID** | US-4.1 |
| **Prioridad** | P0 |
| **Historia** | Como representante de un gimnasio, quiero reclamar o registrar mi centro, para aparecer correctamente en Floit. |

**Criterios de aceptación**

- Dado que un partner quiere registrarse, cuando completa el formulario de alta, entonces el sistema crea una solicitud pendiente de aprobación.
- Dado que el gimnasio ya existe en catálogo, cuando el partner lo reclama, entonces el sistema registra evidencia mínima de propiedad o vínculo.
- Dado que la solicitud fue enviada, cuando finaliza, entonces el partner ve confirmación.

#### US-4.2 Gestión básica de perfil

| Campo | Detalle |
| --- | --- |
| **ID** | US-4.2 |
| **Prioridad** | P0 |
| **Historia** | Como partner, quiero editar la información principal de mi gimnasio, para mantener mi ficha actualizada. |

**Criterios de aceptación**

- El partner puede editar nombre comercial, descripción, horarios, modalidades, amenities, fotos, dirección y contactos.
- Dado que el partner guarda cambios, cuando el sistema los recibe, entonces quedan en estado publicado o pendiente según la política definida.
- Debe existir historial mínimo de última actualización.

#### US-4.3 Gestión de planes y precios referenciales

| Campo | Detalle |
| --- | --- |
| **ID** | US-4.3 |
| **Prioridad** | P0 |
| **Historia** | Como partner, quiero cargar mis planes y precios referenciales, para recibir leads más calificados. |

**Criterios de aceptación**

- Dado que el partner accede a su panel, cuando añade un plan, entonces puede definir nombre, descripción, periodicidad y precio referencial.
- Dado que un plan se desactiva, cuando el partner lo oculta, entonces deja de mostrarse al usuario final.
- Dado que no existe precio exacto o fijo, cuando el partner lo indica, entonces puede mostrarse rango de precio o «consultar».

#### US-4.4 Recepción de leads

| Campo | Detalle |
| --- | --- |
| **ID** | US-4.4 |
| **Prioridad** | P0 |
| **Historia** | Como partner, quiero recibir los leads generados por Floit, para contactarlos rápido. |

**Criterios de aceptación**

- Dado que un usuario envía una solicitud, cuando el lead se registra, entonces el partner lo recibe en su panel y/o por notificación configurada.
- El lead debe mostrar nombre, contacto, interés y fecha/hora.
- Debe poder marcarse manualmente como atendido.

#### US-4.5 Promociones y ofertas

| Campo | Detalle |
| --- | --- |
| **ID** | US-4.5 |
| **Prioridad** | P1 |
| **Historia** | Como partner, quiero publicar promociones, para aumentar mi tasa de conversión. |

**Criterios de aceptación**

- Dado que el partner crea una promoción, cuando la guarda, entonces puede definir título, vigencia y condiciones.
- Dado que la promoción vence, cuando llega su fecha fin, entonces deja de mostrarse automáticamente.
- El sistema debe impedir promociones sin fecha o con condiciones vacías.

---

### Epic 5 — Backoffice operativo y calidad del catálogo

**Objetivo:** asegurar un catálogo confiable y una operación controlada.

#### US-5.1 Alta, edición y moderación de gimnasios desde admin

| Campo | Detalle |
| --- | --- |
| **ID** | US-5.1 |
| **Prioridad** | P0 |
| **Historia** | Como administrador de Floit, quiero crear y editar gimnasios, para construir y mantener el catálogo inicial. |

**Criterios de aceptación**

- El admin puede crear, editar, aprobar, rechazar, archivar y despublicar gimnasios.
- Dado que un gimnasio está incompleto, cuando el admin lo revisa, entonces puede dejarlo en borrador o pendiente.
- El sistema debe registrar quién realizó la acción y cuándo.

#### US-5.2 Taxonomías y atributos estándar

| Campo | Detalle |
| --- | --- |
| **ID** | US-5.2 |
| **Prioridad** | P0 |
| **Historia** | Como administrador, quiero gestionar taxonomías de modalidades y amenities, para estandarizar comparaciones. |

**Criterios de aceptación**

- El admin puede crear, editar y desactivar categorías y atributos.
- Dado que un atributo se desactiva, cuando existe en perfiles previos, entonces no rompe la visualización histórica.
- Las taxonomías deben ser reutilizables en búsqueda, comparación y fichas.

#### US-5.3 Gestión de leads en backoffice

| Campo | Detalle |
| --- | --- |
| **ID** | US-5.3 |
| **Prioridad** | P0 |
| **Historia** | Como equipo Floit, quiero visualizar y gestionar todos los leads, para medir desempeño y apoyar la operación comercial. |

**Criterios de aceptación**

- El backoffice lista leads por fecha, gimnasio, estado y canal.
- Debe ser posible filtrar por gimnasio, zona, estado y fecha.
- Debe poder exportarse la data a CSV.
- Debe existir trazabilidad mínima de cambios de estado.

#### US-5.4 Control de duplicados y calidad de datos

| Campo | Detalle |
| --- | --- |
| **ID** | US-5.4 |
| **Prioridad** | P1 |
| **Historia** | Como administrador, quiero detectar gimnasios duplicados o perfiles incompletos, para mantener integridad del catálogo. |

**Criterios de aceptación**

- Dado que dos perfiles comparten nombre/dirección similares, cuando el sistema los detecta, entonces puede marcarlos como potencial duplicado.
- El admin puede fusionar o archivar perfiles duplicados.
- Debe existir una vista de perfiles incompletos para seguimiento.

#### US-5.5 Gestión de contenido visual

| Campo | Detalle |
| --- | --- |
| **ID** | US-5.5 |
| **Prioridad** | P1 |
| **Historia** | Como administrador, quiero moderar imágenes y descripciones, para asegurar calidad y confianza. |

**Criterios de aceptación**

- El admin puede aprobar o remover fotos y descripciones.
- El sistema impide publicar archivos no soportados o con tamaño excesivo.
- Debe poder definirse una imagen principal por perfil.

---

### Epic 6 — Analítica, experimentación y validación de hipótesis

**Objetivo:** medir si el MVP valida problema, propuesta de valor y modelo de captación.

#### US-6.1 Instrumentación de eventos del funnel

| Campo | Detalle |
| --- | --- |
| **ID** | US-6.1 |
| **Prioridad** | P0 |
| **Historia** | Como product manager, quiero medir el funnel completo, para entender dónde se pierde o convierte el usuario. |

**Criterios de aceptación**

- El sistema registra al menos: búsqueda realizada, filtro usado, ficha vista, comparador abierto, CTA clicado, lead enviado, contacto directo clicado.
- Cada evento debe registrar timestamp, dispositivo, zona y gimnasio cuando aplique.
- Los eventos deben poder consultarse en herramienta analítica o exportarse.

#### US-6.2 Dashboard de métricas MVP

| Campo | Detalle |
| --- | --- |
| **ID** | US-6.2 |
| **Prioridad** | P0 |
| **Historia** | Como equipo Floit, quiero un dashboard de negocio y producto, para evaluar si el MVP funciona. |

**Criterios de aceptación**

- El dashboard muestra como mínimo: usuarios activos, búsquedas, fichas vistas, tasa de comparación, CTR en CTA, leads por gimnasio, tasa de conversión búsqueda→lead.
- Debe existir segmentación por zona, dispositivo y fuente de tráfico.
- La data debe actualizarse con frecuencia definida por operación.

#### US-6.3 Experimentos sobre CTA y captura de leads

| Campo | Detalle |
| --- | --- |
| **ID** | US-6.3 |
| **Prioridad** | P1 |
| **Historia** | Como product manager, quiero probar diferentes CTAs y formularios, para mejorar conversión. |

**Criterios de aceptación**

- Dado que se define un experimento, cuando se activa, entonces el tráfico puede dividirse entre dos variantes.
- Debe poder medirse la diferencia de conversión entre variantes.
- Los experimentos no deben romper la experiencia principal.

#### US-6.4 Encuesta de satisfacción post-lead

| Campo | Detalle |
| --- | --- |
| **ID** | US-6.4 |
| **Prioridad** | P1 |
| **Historia** | Como equipo Floit, quiero preguntar al usuario cómo fue su experiencia, para mejorar calidad y validar utilidad. |

**Criterios de aceptación**

- Dado que un usuario completó una acción clave, cuando pasa el tiempo definido, entonces puede recibir una encuesta corta.
- La encuesta debe capturar al menos utilidad percibida, facilidad de uso y si logró contactar/suscribirse.
- La respuesta debe quedar asociada al gimnasio y a la sesión o lead si es posible.

---

### Epic 7 — Confianza, seguridad y cumplimiento básico

**Objetivo:** proteger la operación y generar credibilidad desde el inicio.

#### US-7.1 Consentimiento y tratamiento de datos

| Campo | Detalle |
| --- | --- |
| **ID** | US-7.1 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero saber qué se hace con mis datos, para confiar en Floit al dejar mis datos de contacto. |

**Criterios de aceptación**

- Antes de enviar un lead, el usuario debe ver aceptación de términos y política de privacidad.
- El sistema debe registrar fecha y hora de aceptación.
- Debe existir acceso visible a política de privacidad y tratamiento de datos.

#### US-7.2 Prevención de spam y abuso en formularios

| Campo | Detalle |
| --- | --- |
| **ID** | US-7.2 |
| **Prioridad** | P0 |
| **Historia** | Como operador, quiero evitar leads falsos o automatizados, para no degradar la calidad comercial. |

**Criterios de aceptación**

- Los formularios deben contar con mecanismos anti-spam.
- Debe existir limitación razonable por IP/dispositivo para envíos repetitivos.
- El sistema debe poder marcar leads sospechosos para revisión.

#### US-7.3 Señalización de información verificada

| Campo | Detalle |
| --- | --- |
| **ID** | US-7.3 |
| **Prioridad** | P1 |
| **Historia** | Como usuario, quiero saber si la información del gimnasio fue validada por Floit o por el partner, para confiar más en lo que veo. |

**Criterios de aceptación**

- El sistema puede mostrar estados como «verificado por partner», «validado por Floit» o «información referencial».
- Debe existir una regla clara para asignar cada estado.
- La señalización debe mostrarse en ficha y, cuando aplique, en comparación.

#### US-7.4 Reportar información incorrecta

| Campo | Detalle |
| --- | --- |
| **ID** | US-7.4 |
| **Prioridad** | P1 |
| **Historia** | Como usuario, quiero reportar errores en una ficha, para ayudar a mejorar la calidad del catálogo. |

**Criterios de aceptación**

- Dado que detecto un error, cuando hago clic en reportar, entonces puedo indicar tipo de problema y comentario.
- El reporte debe quedar registrado en backoffice.
- Debe poder marcarse como resuelto.

---

### Epic 8 — Enablers técnicos y experiencia base

**Objetivo:** asegurar que el MVP sea usable, medible y mantenible.

#### US-8.1 Responsive mobile-first

| Campo | Detalle |
| --- | --- |
| **ID** | US-8.1 |
| **Prioridad** | P0 |
| **Historia** | Como usuario móvil, quiero navegar Floit de forma cómoda, para poder usarlo en mi contexto diario. |

**Criterios de aceptación**

- Las pantallas principales deben funcionar correctamente en móvil y desktop.
- Búsqueda, fichas, comparador y formularios deben ser legibles y accionables en pantallas pequeñas.
- No deben existir bloqueos funcionales en dispositivos móviles comunes.

#### US-8.2 Performance base

| Campo | Detalle |
| --- | --- |
| **ID** | US-8.2 |
| **Prioridad** | P0 |
| **Historia** | Como usuario, quiero que Floit cargue rápido, para no abandonar la experiencia. |

**Criterios de aceptación**

- Las páginas de listado y ficha deben cumplir objetivos internos de carga razonables.
- Debe existir lazy loading para imágenes.
- El sistema debe degradar de forma elegante si falla el mapa o un componente externo.

#### US-8.3 SEO y páginas indexables

| Campo | Detalle |
| --- | --- |
| **ID** | US-8.3 |
| **Prioridad** | P1 |
| **Historia** | Como equipo de crecimiento, quiero que los gimnasios y zonas sean indexables, para capturar demanda orgánica. |

**Criterios de aceptación**

- Cada gimnasio debe tener URL única.
- Las zonas o categorías clave pueden tener páginas indexables.
- Deben existir metadatos básicos para compartir y posicionamiento.

#### US-8.4 Gestión de roles y permisos

| Campo | Detalle |
| --- | --- |
| **ID** | US-8.4 |
| **Prioridad** | P0 |
| **Historia** | Como administrador, quiero controlar accesos por rol, para operar con seguridad. |

**Criterios de aceptación**

- Deben existir al menos roles de admin interno y partner.
- Un partner solo puede editar su información y ver sus leads.
- Un admin puede gestionar catálogo, leads y taxonomías.

---

<a id="priorizacion-por-release"></a>

## Priorización sugerida por release

### Release 1 — MVP validación de problema y mercado

Incluye:

- Epic 1 completa excepto US-1.4
- Epic 2: US-2.1 y US-2.2
- Epic 3: US-3.1, US-3.2, US-3.3
- Epic 4: US-4.1, US-4.2, US-4.3, US-4.4
- Epic 5: US-5.1, US-5.2, US-5.3
- Epic 6: US-6.1, US-6.2
- Epic 7: US-7.1, US-7.2
- Epic 8: US-8.1, US-8.2, US-8.4

### Release 2 — Optimización comercial

Incluye:

- US-1.4, US-2.3, US-2.4
- US-3.4, US-3.5
- US-4.5
- US-5.4, US-5.5
- US-6.3, US-6.4
- US-7.3, US-7.4
- US-8.3

### Release 3 — Transacción asistida y expansión

Posibles historias futuras:

- Reserva de visitas o clases en tiempo real
- Checkout o pago asistido
- Suscripción gestionada en Floit
- Check-in verificable
- Ranking inteligente y recomendaciones
- Módulo corporativo B2B2C

Esto es consistente con el enfoque por fases de los documentos base: primero *discovery* y operación básica; luego control operativo, integraciones ligeras y monetización más sofisticada.

---

<a id="definicion-de-done-recomendada"></a>

## Definición de Done recomendada

Una historia se considera terminada cuando:

- Cumple todos los criterios de aceptación.
- Está diseñada para móvil y desktop.
- Tiene *tracking* analítico implementado.
- Pasó QA funcional.
- Tiene textos y estados vacío/error definidos.
- Fue aprobada por producto y, si aplica, por operación.

---

<a id="hipotesis-de-validacion"></a>

## Hipótesis que este backlog ayuda a validar

1. Los usuarios tienen una necesidad real de **buscar y comparar** gimnasios en una sola plataforma.
2. Ver información estandarizada y comparable **reduce la fricción de decisión**.
3. Los usuarios están dispuestos a usar Floit como canal de **contacto e intención comercial**.
4. Los gimnasios ven valor en recibir leads calificados y mantener un perfil en Floit.
5. Una operación inicialmente asistida puede validar el modelo antes de invertir en reservas, check-ins y pagos complejos.

---

## Exportación a herramientas de gestión

Para llevar este backlog a Jira, Azure DevOps, Linear u otra herramienta, se pueden mapear campos estándar: `Epic`, `Story ID`, `Priority`, `Sprint`, `Dependencies`, `Estimation`, `Owner`. Las tablas por historia facilitan el copiado de metadatos a cada *issue*.
