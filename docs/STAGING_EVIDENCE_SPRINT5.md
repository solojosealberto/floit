# Sprint 5 — plantilla de evidencias (staging)

Plantilla para cerrar Sprint 5 y habilitar prueba integral del flujo usuario con criterios de `GO/NO-GO`.

Referencias:

- Sprints: [`docs/SPRINTS.md`](./SPRINTS.md)
- Estado épicas/US: [`docs/EPICS_USER_STORIES_STATUS.md`](./EPICS_USER_STORIES_STATUS.md)
- Runbook Sprint 4 (auth/rollout): [`docs/oidc-rollout-sprint4.md`](./oidc-rollout-sprint4.md)

---

## Metadatos de ejecución

| Campo | Valor |
|---|---|
| Fecha |  |
| Entorno | staging |
| Release/commit |  |
| Responsable técnico |  |
| Responsable producto/ops |  |
| Ventana de validación |  |
| Resultado `pnpm sprint5:flow-checklist` |  |
| Resultado `pnpm sprint5:kpi-gate` |  |
| Resultado `pnpm sprint4:gate` (si aplica) |  |

---

## 1) Preflight técnico (servicios y contratos)

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| `web /` | 200 |  |  |
| `search /health` | 200 |  |  |
| `catalog /health` | 200 |  |  |
| `leads /health` | 200 |  |  |
| `partner /health` | 200 |  |  |
| `analytics /health` | 200 |  |  |
| `/v1/metrics/funnel` | 200 con `funnel/rates/segments` |  |  |
| `/v1/metrics/experiments/cta-lead-form` | 200 con `summary/points` |  |  |
| `/v1/admin/leads/sla-summary` (auth admin) | 200 con `partnerSlaRate` |  |  |

Comando sugerido:

- `pnpm sprint5:flow-checklist`

---

## 2) Flujo completo usuario (manual guiado)

| Paso | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Abrir `/buscar` y aplicar filtros | lista + mapa consistentes |  |  |
| Abrir ficha `/gyms/[slug]` | datos, badges, CTAs visibles |  |  |
| Validar CTA experimento (membership/trial/whatsapp_first) | variante visible y usable |  |  |
| Ejecutar CTA directo (WA/call/mail) | apertura de canal |  |  |
| Enviar lead por formulario | confirmación y token |  |  |
| Abrir `/lead/confirmacion` y `/lead/estado/[token]` | estado visible |  |  |
| Verificar lead en `/admin/leads` | lead persistido |  |  |
| Verificar evento en `/admin/analytics` | funnel/segmentos actualizados |  |  |

---

## 3) Flujo partner y SLA

| Paso | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Abrir `/partner/leads` | leads por ownership visibles |  |  |
| Marcar lead `contacted` o `closed` | estado actualizado |  |  |
| Revisar `/admin/analytics` bloque SLA | `contactedLeads`/`partnerSlaRate` actualizados |  |  |

---

## 4) KPI gate (Sprint 5)

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Volumen mínimo de eventos | PASS |  |  |
| `search->profile` | PASS |  |  |
| `compare adoption` | PASS |  |  |
| `profile->lead` | PASS |  |  |
| `partner SLA rate` | PASS |  |  |
| Muestras mínimas A/B o multivariante | PASS |  |  |
| Días estables de experimento | PASS |  |  |
| Uplift mínimo vs baseline | PASS |  |  |

Comando sugerido:

- `pnpm sprint5:kpi-gate`

---

## 5) Incidencias y mitigaciones

| ID | Descripción | Severidad | Mitigación aplicada | Estado |
|---|---|---|---|---|
|  |  |  |  |  |

---

## 6) Decisión de cierre Sprint 5

| Criterio | Estado |
|---|---|
| Flujo completo usuario validado end-to-end |  |
| Flujo partner/SLA validado |  |
| Dashboards y métricas consistentes |  |
| KPI gate en PASS |  |
| Aprobación conjunta tech + producto/ops |  |

**Decisión final:** `GO` / `NO-GO`

**Firmas (nombre/fecha):**

- Tech lead:
- Producto:
- Operaciones:

