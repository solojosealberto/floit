# Sprint 5 — evidencias staging

Evidencia objetiva para cerrar Sprint 5 y habilitar prueba integral del flujo usuario con criterios de `GO/NO-GO`.

Referencias:

- Sprints: [`docs/operations/sprints.md`](./sprints.md)
- Estado épicas/US: [`docs/operations/EPICS_USER_STORIES_STATUS.md`](./EPICS_USER_STORIES_STATUS.md)
- Runbook Sprint 4 (auth/rollout): [`docs/operations/oidc-rollout-sprint4.md`](./oidc-rollout-sprint4.md)
- Vault local (gitignored): [`docs/env/staging.local.example`](../env/staging.local.example)

---

## Actualización 2026-05-27 — HEAD `ff98be2`

| Campo | Valor |
|---|---|
| Commit | `ff98be2` — placeholder `VenueImage` (siglas + paleta QueGym, `onError`) |
| `pnpm verify` (local) | **PASS** |
| `smoke:platform` (Railway + staging web) | **PASS** (health 5/5, 95 venues) |
| `pnpm sprint5:staging-gate -- --kpi-relaxed` | **PASS** (190 eventos analytics) |
| CI GitHub (`build`) | **FAIL** en `ff98be2` — `governance-docs-guard` (docs estado sin actualizar en push); job `e2e-services` también falla (arranque web en CI) |
| Working tree local | `quegym-symbol-source.png` modificado (~1.4 MB vs ~47 KB en git) — **no commitear** sin revisión |

---

## Actualización 2026-05-27 — cierre beta (deploy `ca4070b`)

| Campo | Valor |
|---|---|
| Commit | `ca4070b` — `QueGymLogo`, menú móvil opaco, galería partner, assets `/brand/` |
| Deploy Vercel | **OK** — `staging.quegym.com` sirve PNG `/brand/quegym-horizontal-*.png` (HTTP 200) |
| `pnpm verify` (local pre-push) | **PASS** |
| `SMOKE_WEB_BASE=https://staging.quegym.com pnpm smoke:platform` | **PASS** (health 5/5, 95 venues, rutas web) |
| `pnpm sprint5:staging-gate -- --kpi-relaxed` | **PASS** (preflight + KPI smoke) |
| `pnpm sprint5:staging-gate` (umbrales PRD) | **FAIL** — `profile->lead` 0%, `partnerSlaRate` 0%, A/B sin volumen (7 checks) |
| QA visual (`UI_VISUAL_QA_CHECKLIST.md`) | **Pendiente** firma humana (§6b menú móvil incluido) |
| E2E manual §2–3 | **Parcial** — rutas HTTP 200; flujos lead/partner sin ejecutar en sesión |
| **Decisión** | **GO técnico condicional** — plataforma desplegada y gates automatizados OK; bloqueadores producto: conversión KPI, E2E manual completo, firma ops |

Rutas verificadas HTTP 200 post-deploy: `/`, `/buscar`, `/comparar`, `/favoritos`, `/partner/login`, `/admin/login`, `/privacidad`, `/icon.png`.

---

## Actualización 2026-06-15

| Campo | Valor |
|---|---|
| Comando | `pnpm sprint5:staging-gate -- --kpi-relaxed` |
| `sprint5:kpi-gate` | **PASS** (128 eventos; variantes `membership` + `trial` presentes) |
| Notas | Revalidar antes de GO formal; E2E manual §2–3 sigue pendiente |

---

## Metadatos de ejecución

| Campo | Valor |
|---|---|
| Fecha (última corrida gates) | 2026-05-27 |
| Entorno | staging (`https://staging.quegym.com`) |
| Release/commit | `00fd9f9` (`fix(auth): accept Auth0 issuer with or without trailing slash`) + scripts staging |
| Responsable técnico | Agente + operador |
| Responsable producto/ops | Pendiente firma |
| Ventana de validación | 2026-05-27 (re-ejecución tras deploy Railway + token M2M) |
| Comando gates | `pnpm sprint5:staging-gate -- --kpi-relaxed` |
| Resultado `pnpm sprint4:readiness` | **PASS** |
| Resultado `pnpm sprint4:auth-negative` | **PASS** |
| Resultado `pnpm sprint5:flow-checklist` | **PASS** (incl. SLA admin **200**) |
| Resultado `pnpm sprint5:kpi-gate` | **FAIL** (1 check: variantes A/B `membership` + `trial`) |

---

## Resumen ejecutivo

| Área | Estado |
|------|--------|
| Infra 5/5 Railway + smoke | **OK** |
| Auth0 M2M → APIs admin (Bearer) | **OK** (fix issuer trailing slash `00fd9f9`) |
| Vercel `ADMIN_OIDC_ACCESS_TOKEN` | **OK** — `/admin/leads` carga sin 401 |
| Preflight técnico Sprint 5 | **PASS** |
| KPI gate formal (A/B membership+trial) | **FAIL** — poco tráfico/experimentación en staging |
| Flujo manual E2E usuario/partner | **Pendiente** (checklist §2–3 sin completar) |

**Decisión final:** `GO técnico condicional` — plataforma y gates automatizados de preflight en PASS; KPI A/B bloqueado por datos insuficientes; falta E2E manual y firma producto/ops.

---

## 0) Desbloqueo auth admin (2026-05-27)

| Paso | Acción | Resultado |
|------|--------|-----------|
| Auth0 M2M | App **QueGym Admin BFF** → audience `floit-admin`; credenciales en vault `docs/env/staging.local` | Token vía `pnpm auth0:m2m-token` |
| Fix issuer | Auth0 emite `iss` **con** barra final; guards aceptan ambas formas | Commit `00fd9f9`; redeploy Railway `leads`, `partner`, `catalog` |
| Vercel Preview | `ADMIN_OIDC_ACCESS_TOKEN` = token M2M (renovar ~24 h) | BFF admin resuelve Bearer server-side |
| Verificación UI | Login `/admin/login` → `/admin/leads` | HTTP 200; panel operativo (0 leads en BD staging) |

Scripts añadidos en repo:

- `scripts/load-staging-env.mjs`
- `scripts/obtain-auth0-m2m-token.mjs` → `pnpm auth0:m2m-token`
- `scripts/sprint5-staging-gate.mjs` → `pnpm sprint5:staging-gate`

---

## 1) Preflight técnico (servicios y contratos)

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| `web /` | 200 | **PASS** | `flow-checklist` |
| `search /health` | 200 | **PASS** | `flow-checklist` |
| `catalog /health` | 200 | **PASS** | `flow-checklist` |
| `leads /health` | 200 | **PASS** | `flow-checklist` |
| `partner /health` | 200 | **PASS** | `flow-checklist` |
| `analytics /health` | 200 | **PASS** | `flow-checklist` |
| `/v1/metrics/funnel` | 200 con `funnel/rates/segments` | **PASS** | `flow-checklist` |
| `/v1/metrics/experiments/cta-lead-form` | 200 con `summary/points` | **PASS** | `flow-checklist` |
| `/v1/admin/leads/sla-summary` (Bearer M2M) | 200 con `partnerSlaRate` | **PASS** | HTTP 200 tras fix issuer + M2M |

Comando:

```bash
# Requiere docs/env/staging.local con AUTH0_M2M_* o LEADS_SLA_AUTH_BEARER
pnpm sprint5:staging-gate -- --kpi-relaxed
```

---

## 2) Flujo completo usuario (manual guiado)

| Paso | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Abrir `/buscar` y aplicar filtros | lista + mapa consistentes | Pendiente | |
| Abrir ficha `/gyms/[slug]` | datos, badges, CTAs visibles | Pendiente | |
| Validar CTA experimento (membership/trial/whatsapp_first) | variante visible y usable | Pendiente | Generar tráfico para KPI A/B |
| Ejecutar CTA directo (WA/call/mail) | apertura de canal | Pendiente | |
| Enviar lead por formulario | confirmación y token | Pendiente | |
| Abrir `/lead/confirmacion` y `/lead/estado/[token]` | estado visible | Pendiente | |
| Verificar lead en `/admin/leads` | lead persistido | Parcial | UI carga OK; 0 leads en staging |
| Verificar evento en `/admin/analytics` | funnel/segmentos actualizados | Parcial | ~21 eventos en analytics |

---

## 3) Flujo partner y SLA

| Paso | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Abrir `/partner/leads` | leads por ownership visibles | Pendiente | |
| Marcar lead `contacted` o `closed` | estado actualizado | Pendiente | |
| Revisar `/admin/analytics` bloque SLA | `contactedLeads`/`partnerSlaRate` actualizados | Parcial | endpoint SLA **200**; datos vacíos |

---

## 4) KPI gate (Sprint 5)

Ejecución 2026-05-27 con `--kpi-relaxed` (umbrales mínimos para smoke staging):

| Check | Esperado | Resultado | Evidencia |
|---|---|---|---|
| Volumen mínimo de eventos | PASS (≥1) | **PASS** | `events=21` |
| `search->profile` | PASS (≥0%) | **PASS** | `20.00%` |
| `compare adoption` | PASS (≥0%) | **PASS** | `0.00%` |
| `profile->lead` | PASS (≥0%) | **PASS** | `0.00%` |
| `partner SLA rate` | PASS (≥0%) | **PASS** | `0.00%` |
| Variantes A/B `membership` + `trial` | PASS | **FAIL** | `missing cta_lead_form_v1 variants` |
| Variante `whatsapp_first` | PASS | **PASS** | presente |
| Días estables / uplift mínimo | PASS (modo relaxed) | No evaluado | aborta tras fallo A/B |

Comando:

```bash
pnpm sprint5:staging-gate -- --kpi-relaxed
# Solo KPI (con env staging.local):
pnpm sprint5:kpi-gate -- --relaxed
```

Para **PASS formal** del KPI gate: generar tráfico real en staging (buscar → ficha → lead con variantes CTA) o ejecutar sesión QA instrumentada documentada en §2.

---

## 5) Incidencias y mitigaciones

| ID | Descripción | Severidad | Mitigación aplicada | Estado |
|---|---|---|---|---|
| S5-001 | `/v1/admin/leads/sla-summary` respondía 401 sin Bearer | Alta | M2M Auth0 + `LEADS_SLA_AUTH_BEARER`; fix issuer `00fd9f9` | **Cerrada** |
| S5-002 | Analytics/leads HTTP 500 en Railway | Alta | `DATABASE_SYNC=true` una vez en leads/analytics Neon | **Cerrada** |
| S5-003 | KPI A/B sin variantes membership+trial | Media | Poco tráfico staging; generar eventos `experiment_assignment` | **Abierta** |
| S5-004 | Token M2M expira ~24 h | Media | Renovar con `pnpm auth0:m2m-token` y actualizar Vercel Preview | **Operativa** |

---

## 6) Decisión de cierre Sprint 5

| Criterio | Estado |
|---|---|
| Preflight técnico (servicios + endpoints) | **PASS** |
| Auth admin M2M en APIs y BFF Vercel | **PASS** |
| Flujo completo usuario validado end-to-end | **Pendiente** |
| Flujo partner/SLA validado manualmente | **Pendiente** |
| Dashboards y métricas consistentes | **Parcial** (~21 eventos) |
| KPI gate en PASS (umbrales PRD) | **FAIL** (solo A/B membership+trial) |
| Aprobación conjunta tech + producto/ops | **Pendiente** |

**Decisión final:** `GO técnico condicional`

- Infra, auth y preflight automatizado: listos para beta controlada en staging.
- Cierre formal Sprint 5 / entrada beta: requiere tráfico A/B, E2E manual §2–3 y firma producto/ops.

**Firmas (nombre/fecha):**

- Tech lead:
- Producto:
- Operaciones:
