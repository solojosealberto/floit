# Status changelog (flips de estado operativo)

Registro corto de cambios de **estado vivo** (no changelog de producto). Actualizar en el mismo PR/commit que mueva un gate, QA, GO o deploy relevante.

Formato: `YYYY-MM-DD | SHA | qué cambió | evidencia`.

| Fecha | SHA / ref | Cambio | Evidencia |
|-------|-----------|--------|-----------|
| 2026-08-03 | Railway | Partner admin **PASS**: `ADMIN_OIDC_ISSUER` era `floit-admin` (audience) → corregido a Auth0 URL; catalog OIDC ON; delegate email; analytics `ANALYTICS_ALLOW_BACKDATE=true`; redeploy partner/catalog/analytics | Probes M2M claims/profile/plans/photos/taxonomy **200** |
| 2026-08-03 | `49cb52a` | BFF admin: renovación M2M automática (`AUTH0_M2M_*`); OIDC JWKS harden en catalog/leads; partner fix `d9373dc` | Code on `main` |
| 2026-08-03 | `d9373dc` | Fix código partner admin 500: normalizar issuer/JWKS OIDC + try/catch en guards (`oidc-jose.ts`); **redeploy Railway pendiente** | `ADMIN_STAGING_QA_REPORT.md` H1 |
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
