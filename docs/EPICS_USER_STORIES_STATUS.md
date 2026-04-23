# Floit — estado de épicas e historias implementadas

Recuento consolidado del avance funcional contra `Backlog Floit.md`, basado en lo documentado y entregado en `docs/SPRINTS.md` (Sprints 0–5 en curso).

Escala de estado:

- `Implementada`: cobertura funcional principal entregada.
- `Parcial`: implementación inicial o incompleta respecto a criterios de aceptación completos.
- `Pendiente`: sin implementación funcional relevante en el repositorio.

---

## Epic 1 — Descubrimiento y búsqueda

| User story | Estado | Evidencia principal |
|---|---|---|
| US-1.1 Búsqueda por zona/ubicación | Implementada | `search-service` + `/buscar` lista/mapa |
| US-1.2 Filtros básicos | Implementada | Filtros en querystring y aplicación server-side |
| US-1.3 Vista lista y mapa | Implementada | `/buscar` con lista + `DiscoveryMap` |
| US-1.4 Orden por relevancia | Implementada | `sort=relevance/popularity/distance/price` |

## Epic 2 — Perfil y comparación

| User story | Estado | Evidencia principal |
|---|---|---|
| US-2.1 Perfil detallado | Implementada | `/gyms/[slug]`, datos de catálogo + CTAs |
| US-2.2 Comparador | Implementada | `/comparar` hasta 3 centros (MVP) |
| US-2.3 Badges de valor | Implementada | badges en búsqueda/ficha |
| US-2.4 Favoritos | Implementada | `localStorage` + `/favoritos` |

## Epic 3 — Contacto y solicitud

| User story | Estado | Evidencia principal |
|---|---|---|
| US-3.1 Solicitud de info/suscripción | Implementada | `POST /v1/leads` + formulario en ficha |
| US-3.2 Contacto directo (WA/llamada/correo) | Implementada | `gym-direct-contact.tsx` |
| US-3.3 Confirmación y seguimiento básico | Implementada | `/lead/confirmacion`, `/lead/estado/[token]` |
| US-3.4 Agendar visita/prueba | Parcial | intent `trial` + preferencia horaria, sin agenda real |
| US-3.5 Estado del lead | Implementada (operación) | estados `received/contacted/closed`, panel admin/partner |

## Epic 4 — Onboarding/autoservicio partner

| User story | Estado | Evidencia principal |
|---|---|---|
| US-4.1 Claim de perfil | Implementada | claim público + revisión admin |
| US-4.2 Gestión básica de perfil | Implementada | `GET/PUT /v1/partner/me/profile`, `/partner/panel` |
| US-4.3 Gestión de planes/precios | Implementada | `GET/POST/PATCH /v1/partner/me/plans*` |
| US-4.4 Recepción de leads | Implementada | `/partner/leads` + ownership + update estado |
| US-4.5 Promociones/ofertas | Implementada (MVP base) | promociones activas en catálogo/ficha |

## Epic 5 — Backoffice y calidad catálogo

| User story | Estado | Evidencia principal |
|---|---|---|
| US-5.1 Alta/edición/moderación admin | Parcial | vistas/admin operativas; moderación avanzada pendiente |
| US-5.2 Taxonomías y atributos | Parcial | taxonomías usadas en búsqueda; CRUD admin completo pendiente |
| US-5.3 Gestión de leads backoffice | Implementada | `/admin/leads`, filtros base, CSV, SLA summary |
| US-5.4 Duplicados/calidad de datos | Implementada (detección), Parcial (acción) | `duplicate-suspects` listo; merge/flujo editorial pendiente |
| US-5.5 Gestión de contenido visual | Parcial | bases de calidad; moderación multimedia completa pendiente |

## Epic 6 — Analítica y experimentación

| User story | Estado | Evidencia principal |
|---|---|---|
| US-6.1 Instrumentación del funnel | Implementada | eventos funnel + segmentos + series |
| US-6.2 Dashboard de métricas MVP | Implementada | `/admin/analytics` con KPIs/funnel/SLA |
| US-6.3 Experimentos CTA/form | Implementada (fase inicial) | `cta_lead_entrypoint_v2` + gate A/B |
| US-6.4 Encuesta post-lead | Parcial | flujo y evento `lead_survey` base |

## Epic 7 — Confianza, seguridad y cumplimiento

| User story | Estado | Evidencia principal |
|---|---|---|
| US-7.1 Consentimiento y tratamiento | Implementada | `consentAccepted/consentVersion` + `/privacidad` |
| US-7.2 Anti-spam y abuso | Implementada | throttling + IP/suspicious + Turnstile |
| US-7.3 Señalización verificada | Implementada | badges `floit_verified/partner_verified/reference` |
| US-7.4 Reportar info incorrecta | Implementada | `POST /v1/venues/:slug/reports` + UI |

## Epic 8 — Enablers técnicos

| User story | Estado | Evidencia principal |
|---|---|---|
| US-8.1 Responsive mobile-first | Implementada | rutas públicas/partner/admin responsive |
| US-8.2 Performance base | Parcial | optimizaciones base; budget/perf-gate formal pendiente |
| US-8.3 SEO e indexabilidad | Implementada | metadata, sitemap, robots, URLs por gym |
| US-8.4 Roles y permisos | Implementada | OIDC + guards admin/partner + ownership RBAC |

---

## Resumen ejecutivo por estado

- `Implementadas`: 24 historias (incluyendo implementaciones operativas MVP).
- `Parciales`: 9 historias (normalmente por profundidad operativa/UX o alcance extendido).
- `Pendientes`: 0 en nivel “sin señal”, pero varias parciales requieren cierre de producción/ops.

> Nota: este recuento mide cobertura funcional MVP y no implica cierre formal de rollout en staging/prod (pendientes operativos documentados en `docs/SPRINTS.md`).
