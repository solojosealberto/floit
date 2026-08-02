# Guía de documentación QueGym (humanos + agentes)

## Lectura obligatoria al retomar

1. [`NEXT_AGENT_BRIEF.md`](./NEXT_AGENT_BRIEF.md) — **CURRENT TRUTH**
2. [`DOC_STATUS_VOCABULARY.md`](./DOC_STATUS_VOCABULARY.md) — términos permitidos
3. [`STATUS_CHANGELOG.md`](./STATUS_CHANGELOG.md) — últimos flips

## Mapa por rol

| Necesitas… | Abre… |
|------------|--------|
| Qué hacer ahora | `NEXT_AGENT_BRIEF.md` |
| Infra staging / DNS / Railway checklist | `STAGING_DEPLOYMENT_STATUS.md` |
| Pruebas y firmas Sprint 5 | `STAGING_EVIDENCE_SPRINT5.md` §0 solamente |
| Qué se entregó por sprint | `sprints.md` |
| Cobertura de historias | `EPICS_USER_STORIES_STATUS.md` |
| Arquitectura y handoff largo | `PROJECT_CONTEXT_HANDOVER.md` |
| Cutover prod | `PRODUCTION_LAUNCH_PLAN.md` |
| Alta de cuentas (histórico paso 2) | `PRODUCTION_ACCOUNTS_SETUP.md` |
| Estrategia backlog largo | `NEXT_STEPS_RECOMMENDED.md` (Priority 0 → brief) |
| Rutas web | `WEB_ROUTES_PLATFORM.md` |
| Local | `LOCALHOST_LINKS_GUIDE.md` |
| Catálogo CSV | `VENUES_CATALOG_IMPORT.md` |
| Design UX (no estado release) | `docs/ux/*` — planes con `status: done` no re-ejecutar |
| Wireframes históricos | `docs/archive/wireframe-v0.2/README.md` (carpeta fuente **no** en repo) |

## Reglas anti-contradicción

1. **Un solo next:** solo el brief define las próximas 3 acciones.
2. Al cerrar trabajo: actualizar brief + `STATUS_CHANGELOG` **antes** de append en evidencias.
3. Evidencias append-only: el bloque nuevo va arriba o en §0; marcar el resto `Histórico`.
4. Informes con banner `Superseded` no definen prioridad.
5. KPI es **rolling** — ver brief § Política KPI.
6. Separar siempre `E2E lead API` vs `E2E checklist §2–3`.

## Runtime vs docs

- Runtime: `apps/web`, `services/*`, `packages/*`, `openapi/`, `contracts/events/`, `scripts/`
- Estado operativo: brief + trinity + staging status
- Producto rector (visión): `docs/product/*` — no es estado de sprint
