# Sprint 5 — plantilla de evidencias (staging)

Plantilla para cerrar Sprint 5 y habilitar prueba integral del flujo usuario con criterios de `GO/NO-GO`.

Referencias:

- Sprints: [`docs/operations/sprints.md`](./operations/sprints.md)
- Estado épicas/US: [`docs/operations/EPICS_USER_STORIES_STATUS.md`](./operations/EPICS_USER_STORIES_STATUS.md)
- Runbook Sprint 4 (auth/rollout): [`docs/operations/oidc-rollout-sprint4.md`](./operations/oidc-rollout-sprint4.md)

---

## Metadatos de ejecución

| Campo | Valor |
|---|---|
| Fecha | 2026-05-26 |
| Entorno | staging |
| Release/commit | `3838fe7` + `main` vigente |
| Responsable técnico | Agente + operador |
| Responsable producto/ops | Pendiente firma |
| Ventana de validación | 2026-05-26 22:00-22:12 UTC-4 |
| Resultado `pnpm sprint5:flow-checklist` | FAIL (`leads SLA endpoint` 401) |
| Resultado `pnpm sprint5:kpi-gate` | FAIL (`sla HTTP 401`) |
| Resultado `pnpm sprint4:gate` (si aplica) | PASS |

---

## 1) Preflight técnico (servicios y contratos)

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| `web /` | 200 | PASS | `flow-checklist` HTTP 200 |
| `search /health` | 200 | PASS | `flow-checklist` HTTP 200 |
| `catalog /health` | 200 | PASS | `flow-checklist` HTTP 200 |
| `leads /health` | 200 | PASS | `flow-checklist` HTTP 200 |
| `partner /health` | 200 | PASS | `flow-checklist` HTTP 200 |
| `analytics /health` | 200 | PASS | `flow-checklist` HTTP 200 |
| `/v1/metrics/funnel` | 200 con `funnel/rates/segments` | PASS | `flow-checklist` HTTP 200 |
| `/v1/metrics/experiments/cta-lead-form` | 200 con `summary/points` | PASS | `flow-checklist` HTTP 200 |
| `/v1/admin/leads/sla-summary` (auth admin) | 200 con `partnerSlaRate` | FAIL | HTTP 401 (falta credencial admin) |

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
| Volumen mínimo de eventos | PASS | No evaluado | `kpi-gate` aborta antes por SLA 401 |
| `search->profile` | PASS | No evaluado | `kpi-gate` aborta antes por SLA 401 |
| `compare adoption` | PASS | No evaluado | `kpi-gate` aborta antes por SLA 401 |
| `profile->lead` | PASS | No evaluado | `kpi-gate` aborta antes por SLA 401 |
| `partner SLA rate` | PASS | FAIL | `sla HTTP 401` |
| Muestras mínimas A/B o multivariante | PASS | No evaluado | `kpi-gate` aborta antes por SLA 401 |
| Días estables de experimento | PASS | No evaluado | `kpi-gate` aborta antes por SLA 401 |
| Uplift mínimo vs baseline | PASS | No evaluado | `kpi-gate` aborta antes por SLA 401 |

Comando sugerido:

- `pnpm sprint5:kpi-gate`

---

## 5) Incidencias y mitigaciones

| ID | Descripción | Severidad | Mitigación aplicada | Estado |
|---|---|---|---|---|
| S5-001 | `/v1/admin/leads/sla-summary` responde 401 sin credencial admin en gates staging | Alta | Definir `LEADS_SLA_AUTH_BEARER` (M2M Auth0) o `LEADS_SLA_ADMIN_TOKEN` para ejecución de scripts | Abierta |

---

## 6) Decisión de cierre Sprint 5

| Criterio | Estado |
|---|---|
| Flujo completo usuario validado end-to-end | Parcial (preflight técnico OK) |
| Flujo partner/SLA validado | FAIL (SLA admin 401 en scripts) |
| Dashboards y métricas consistentes | Parcial (analytics endpoints 200) |
| KPI gate en PASS | FAIL |
| Aprobación conjunta tech + producto/ops | Pendiente |

**Decisión final:** `NO-GO` (bloqueado por auth admin en SLA para gates Sprint 5)

**Firmas (nombre/fecha):**

- Tech lead:
- Producto:
- Operaciones:

