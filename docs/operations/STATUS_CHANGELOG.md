# Status changelog (flips de estado operativo)

Registro corto de cambios de **estado vivo** (no changelog de producto). Actualizar en el mismo PR/commit que mueva un gate, QA, GO o deploy relevante.

Formato: `YYYY-MM-DD | SHA | qué cambió | evidencia`.

| Fecha | SHA / ref | Cambio | Evidencia |
|-------|-----------|--------|-----------|
| 2026-08-03 | `300fc35` | Docs: geo VE live en brief; reconciliación trinidad + staging | `NEXT_AGENT_BRIEF.md` + trinity |
| 2026-08-03 | `f688639` | Geo resolve: preferir zonas featured Caracas (fix `Las Mercedes`→Baruta 29 hits) | Probe catalog `?zone=Las Mercedes` |
| 2026-08-03 | `cbaabe6` | Geo backfill: slugify + preferencia municipios AM (Libertador→DC) | Detail Activa Gym `VE-A` |
| 2026-08-03 | `9194a49` | Geo VE nacional: Ciudad=municipio, Zona=barrio/sector; `/v1/meta/geo/*`; cascada panel; legacy `?zone=` | 24 estados / featured chips |
| 2026-08-03 | `fc4dec8` | Panel: Instagram + website estructurados (`instagramHandle`/`websiteUrl`) | partner + catalog OpenAPI |
| 2026-08-03 | `b522d98` | Panel: editor ubicación con mapa (lat/lng) | `venue-location-editor.tsx` |
| 2026-08-03 | `955de56` | Taxonomías: DELETE + sync-from-venues + auto-heal; staging 36 attrs | `/admin/taxonomias` |
| 2026-08-03 | `330c4aa` | Fotos durables: volume Railway `/data/uploads` + `blobBase64` Neon | `PartnerUploadsController` |
| 2026-08-03 | `dc4748c` | Perfil admin: tipo multi-select, horarios day/time picker, descripción full-width | staging panel UI |
| 2026-08-03 | `7686b4f` | Ficha gym: planes reales `catalog.plans` (no mocks); sync JSON + priceMin/Max | GET venue.plans |
| 2026-08-03 | `9f6ebbf` | Planes panel: create/list UX + edit/delete; DELETE API; docs media URL | partner/web/openapi |
| 2026-08-03 | `88a683a` | Fotos: `PARTNER_PUBLIC_BASE_URL` + rewrite localhost; preview al seleccionar | upload HTTPS |
| 2026-08-03 | `8333061` | Panel admin: hydrate catálogo + sync name/modalities/amenities/schedule | partner/catalog/web |
| 2026-08-03 | Vercel | `AUTH0_M2M_*` + `ADMIN_OIDC_ISSUER` en Production/Preview; redeploy `staging.quegym.com`; BFF `/api/admin/leads` + taxonomy **200** | Probe HTTP post-redeploy |
| 2026-08-03 | Railway | Partner admin **PASS**: issuer era audience → Auth0 URL; catalog OIDC; delegate; analytics backdate ON | M2M claims/profile/plans/photos/taxonomy **200** |
| 2026-08-03 | `49cb52a` | BFF admin: renovación M2M automática (`AUTH0_M2M_*`); OIDC JWKS harden en catalog/leads; partner fix `d9373dc` | Code on `main` |
| 2026-08-03 | `d9373dc` | Fix código partner admin 500: normalize issuer/JWKS OIDC + try/catch en guards | `ADMIN_STAGING_QA_REPORT.md` H1 |
| 2026-08-02 | `027b56d`+ | QA admin staging: partner admin APIs **500**; catalog admin **401**; BFF leads **401** — ver `ADMIN_STAGING_QA_REPORT.md` | Suite HTTP admin |
| 2026-08-02 | `f937abf` | Reconciliación documental P0–P2: brief = CURRENT TRUTH; KPI live **FAIL PRD** (8 checks, ventana 7d vacía); smoke **PASS** 5/5; QA visual = PASS (no reabrir) | Este log + `NEXT_AGENT_BRIEF.md` |
| 2026-06-17 | `f937abf` | Pico KPI **PASS PRD 16/17** (solo `stable days`); E2E lead API PASS; script traffic + backdate en código | `STAGING_EVIDENCE_SPRINT5.md` (histórico) |
| 2026-06-16 | `ff98be2` | Placeholder `VenueImage` en staging | Deploy Vercel |
| 2026-06-15 | `ca4070b` | Logo + menú móvil + galería partner en staging | Deploy Vercel |
| 2026-05-27 | `00fd9f9` | Admin M2M + issuer; `PASS relaxed`; QA visual PASS | Evidencia S5 / agent report (histórico) |
| 2026-05-26 | — | Import 95 venues; health 5/5; smoke OK | `STAGING_DEPLOYMENT_STATUS.md` |

## Política

1. No citar un KPI PRD sin fila en esta tabla **o** run del mismo día en el brief.
2. Tras `PASS PRD 17/17` o firma GO: añadir fila inmediata.
3. Tras cutover `www.quegym.com`: añadir fila + actualizar brief.
