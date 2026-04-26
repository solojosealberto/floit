# Floit Architecture Review

**Generated:** 2026-04-26  
**Reviewer:** Cursor Cloud Agent  
**Repository:** Floit MVP — Fitness Marketplace (Caracas)

---

## Executive Summary

Floit is a **well-architected TypeScript monorepo** implementing a fitness venue discovery and lead generation marketplace for Caracas, Venezuela. The architecture demonstrates strong adherence to **bounded context principles**, **contract-first API design**, and **vertical slice development**. The codebase is at **Sprint 5** of active development, with core discovery, comparison, lead generation, partner management, and analytics capabilities operational.

### Key Strengths

1. **Clear bounded contexts** with independent NestJS microservices
2. **Contract-first approach** with OpenAPI 3.1 specifications
3. **BFF pattern** using Next.js App Router API routes
4. **Progressive enhancement** from MVP to production-grade features
5. **Strong operational discipline** with health checks, DLQ, retry patterns
6. **Comprehensive documentation** aligned with PRD and backlog

### Architecture Maturity: **7.5/10**

The architecture is solid for an MVP with clear paths to production. Main gaps are in deployment automation, external event bus integration, and comprehensive observability.

---

## 1. High-Level Architecture

### 1.1 Architecture Pattern

**Bounded Context Microservices + BFF + Shared Packages**

```
┌─────────────────────────────────────────────────────────────┐
│                        User / Partner                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │   Next.js Web App     │
                │  (apps/web)           │
                │  - UI (React 19)      │
                │  - BFF (API routes)   │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────┐  ┌───────▼────┐  ┌─────▼─────┐  ┌─────────┐  ┌──────────┐
│  Catalog   │  │  Search    │  │   Leads   │  │ Partner │  │Analytics │
│ (NestJS)   │  │  (NestJS)  │  │ (NestJS)  │  │(NestJS) │  │(NestJS)  │
│ Port 4010  │  │  Port 4011 │  │Port 4012  │  │Port 4013│  │Port 4014 │
└─────┬──────┘  └─────┬──────┘  └─────┬─────┘  └────┬────┘  └────┬─────┘
      │               │               │             │            │
      ▼               │               ▼             ▼            ▼
┌──────────┐          │         ┌──────────┐ ┌──────────┐ ┌──────────┐
│Postgres  │          └────────►│ SQLite   │ │ SQLite   │ │ SQLite   │
│(PostGIS) │                    │ (Leads)  │ │(Partner) │ │(Analytics)│
└──────────┘                    └──────────┘ └──────────┘ └──────────┘
```

### 1.2 Service Responsibilities

| Service | Port | Database | Ownership | Key Entities |
|---------|------|----------|-----------|--------------|
| **catalog** | 4010 | Postgres (PostGIS) | Venue master data, promotions, reports | VenueEntity, PromotionEntity, VenueReportEntity |
| **search** | 4011 | N/A (delegates to catalog) | Discovery facade, meta zones | Stateless proxy |
| **leads** | 4012 | SQLite | Lead lifecycle, notifications, admin export | LeadEntity, NotificationDeliveryEntity |
| **partner** | 4013 | SQLite | Claims, ownership, profile, plans, sync | PartnerClaimEntity, PartnerProfileEntity, PartnerPlanEntity, PartnerVenueOwnershipEntity |
| **analytics** | 4014 | SQLite | Event ingestion, funnel metrics, experiments | AnalyticsEventEntity |

---

## 2. Bounded Contexts Analysis

### 2.1 Catalog Service

**Role:** Source of truth for venue master data

**Strengths:**
- PostGIS for geospatial queries (lat/lng, proximity)
- TypeORM with sync capability for rapid iteration
- Seed service for demo data (`SEED_ON_BOOT`)
- Clean entity design with promotions and reports
- Internal API guard for service-to-service calls

**Considerations:**
- Database sync in production should be disabled
- Seed service should not run in production
- Missing indexes on frequently queried fields (zone, verificationStatus)

**Key Files:**
- `services/catalog/src/venues/venue.entity.ts`
- `services/catalog/src/seed/seed.service.ts`
- `services/catalog/src/venues/venues.service.ts`

### 2.2 Search Service

**Role:** Discovery facade delegating to catalog

**Strengths:**
- Stateless design (no database)
- Clean delegation pattern via HttpModule
- Proper timeout and user-agent configuration

**Considerations:**
- Currently a thin proxy; future could add caching layer
- No search index (relying on catalog queries)
- Could benefit from Redis for response caching

**Key Files:**
- `services/search/src/search.controller.ts`
- `services/search/src/app.module.ts`

### 2.3 Leads Service

**Role:** Lead lifecycle, notifications, admin operations

**Strengths:**
- Throttling (12 req/min) for anti-spam
- Persistent notification queue with DLQ pattern
- Retry with exponential backoff
- CSV export for admin operations
- Client IP tracking and suspicious lead detection
- OIDC authentication with configurable fallback
- Internal API for partner service integration

**Considerations:**
- SQLite appropriate for MVP; consider Postgres for production
- Webhook notifications could fail silently if queue is full
- Missing lead assignment/routing logic to partners

**Key Files:**
- `services/leads/src/leads.service.ts`
- `services/leads/src/notification-dispatcher.service.ts`
- `services/leads/src/admin-leads.controller.ts`

### 2.4 Partner Service

**Role:** Partner onboarding, ownership, profile, catalog sync

**Strengths:**
- Complete RBAC with ownership validation
- Transactional outbox pattern (phase 1) for catalog sync
- DLQ and retry for sync failures
- Audit trail for ownership changes
- Health endpoint with readiness indicators for OIDC rollout
- Service-to-service integration with leads via internal API

**Considerations:**
- Outbox currently processes in-process; needs external broker (NATS/Rabbit/SQS)
- SQLite for prototyping; production needs Postgres
- No rate limiting on partner endpoints yet

**Key Files:**
- `services/partner/src/partner-claims.service.ts`
- `services/partner/src/partner-catalog-sync-outbox.service.ts`
- `services/partner/src/partner-auth.guard.ts`

### 2.5 Analytics Service

**Role:** Event ingestion, funnel metrics, experimentation

**Strengths:**
- Durable persistence (SQLite) for events
- Funnel metrics with segmentation (zone, device, source)
- Time-series support for trend analysis
- A/B experiment evaluation with statistical criteria
- Integration with leads for SLA tracking

**Considerations:**
- Event schema not validated against JSON Schema contracts
- No event deduplication (idempotency)
- Missing GDPR/data retention policies
- Could benefit from time-series database (TimescaleDB/ClickHouse) at scale

**Key Files:**
- `services/analytics/src/events.controller.ts`
- `services/analytics/src/analytics-event.entity.ts`

---

## 3. Frontend Architecture (Next.js BFF)

### 3.1 Next.js App Router Structure

**Pattern:** Server Components + API Routes (BFF)

**Strengths:**
- Mobile-first responsive design
- Server-side rendering for SEO
- API routes as BFF layer for service composition
- Proper separation: public routes vs admin vs partner
- Turnstile integration for bot protection
- Analytics event enrichment in BFF

**Routes:**

| Route Pattern | Purpose | Backend Services |
|---------------|---------|------------------|
| `/buscar` | Discovery list/map | search → catalog |
| `/gyms/[slug]` | Venue profile | catalog, leads |
| `/comparar` | Comparison view | catalog (batch) |
| `/favoritos` | Favorites | catalog (batch) |
| `/admin/leads` | Admin lead management | leads |
| `/admin/partner-claims` | Admin partner ops | partner |
| `/admin/analytics` | Analytics dashboard | analytics, leads |
| `/partner/panel` | Partner profile | partner |
| `/partner/leads` | Partner lead inbox | partner → leads |
| `/api/*` | BFF proxies | All services |

**Considerations:**
- Missing error boundaries for service failures
- No request tracing/correlation IDs across services
- Client-side analytics could batch events
- Missing loading states for slow backend responses

**Key Files:**
- `apps/web/src/app/buscar/buscar-client.tsx`
- `apps/web/src/app/api/leads/route.ts`
- `apps/web/src/app/admin/analytics/page.tsx`

---

## 4. Data Architecture

### 4.1 Database Strategy

| Service | Database | Rationale | Production Recommendation |
|---------|----------|-----------|---------------------------|
| catalog | Postgres + PostGIS | Geospatial queries, relational integrity | ✅ Keep Postgres, add read replicas |
| leads | SQLite | Fast prototyping, local persistence | ⚠️ Migrate to Postgres for durability |
| partner | SQLite | Fast prototyping, local persistence | ⚠️ Migrate to Postgres for transactions |
| analytics | SQLite | Fast prototyping, local persistence | ⚠️ Consider TimescaleDB or ClickHouse |

### 4.2 Data Ownership Boundaries

**Strict Ownership Enforced:**
- Catalog owns venue master data
- Leads owns lead lifecycle and consent
- Partner owns claims, ownership, profile
- No cross-database queries observed ✅

**Service-to-Service Communication:**
- Partner → Catalog: Internal API (`POST /v1/internal/partner-sync`)
- Partner → Leads: Internal API (`GET /v1/internal/leads/by-venue`)
- Leads → Analytics: HTTP event push (`POST /v1/events`)

**Future Event-Driven Patterns:**
- Outbox phase 1 implemented in partner service
- Ready for broker integration (NATS/Rabbit/SQS)
- Event schemas defined in `contracts/events/*.json`

---

## 5. API Contracts (OpenAPI 3.1)

### 5.1 Contract Coverage

All services have OpenAPI specifications in `/openapi`:

| Spec | Status | Key Endpoints | Authentication |
|------|--------|---------------|----------------|
| `catalog.yaml` | ✅ Complete | `/v1/venues`, `/v1/meta/zones`, `/v1/internal/partner-sync` | Internal API token |
| `search.yaml` | ✅ Complete | `/v1/search`, `/v1/meta/zones` | Public |
| `leads.yaml` | ✅ Complete | `/v1/leads`, `/v1/admin/leads`, `/v1/internal/leads` | OIDC (admin), Internal token |
| `partner.yaml` | ✅ Complete | `/v1/partner/me/*`, `/v1/admin/claims/*` | OIDC (partner/admin) |
| `analytics.yaml` | ✅ Complete | `/v1/events`, `/v1/metrics/funnel`, `/v1/metrics/timeseries` | Internal token |

### 5.2 Contract-First Workflow

**Process Observed:**
1. API change → Update OpenAPI YAML first
2. Generate/update DTOs and controllers
3. Update BFF proxies in `apps/web/src/app/api`
4. Validate with `pnpm verify` (lint + typecheck + build)

**Strengths:**
- Consistent error response format (`code`, `message`, `details`)
- Versioning strategy (`/v1`) for backward compatibility
- Clear component schemas for reuse

**Gaps:**
- No OpenAPI tooling for validation (Spectral, Prism)
- No contract testing (Pact, Spring Cloud Contract)
- Missing rate limit headers in specs

---

## 6. Security & Authentication

### 6.1 Authentication Strategy

**OIDC with Gradual Rollout:**

| Context | Current State | Flags |
|---------|---------------|-------|
| Admin (leads) | OIDC + fallback `x-admin-token` | `ADMIN_AUTH_REQUIRE_OIDC` |
| Admin (partner) | OIDC + fallback `x-admin-token` | `ADMIN_AUTH_REQUIRE_OIDC` |
| Partner | OIDC + fallback `x-partner-email` (dev) | `PARTNER_AUTH_REQUIRE_OIDC` |

**Implementation:**
- JWKS validation via `jose` library
- Issuer and audience checks
- Node 22 compatibility (dynamic ESM import)
- Health endpoint exposes auth mode for readiness checks

**Strengths:**
- Gradual rollout with feature flags
- Automated readiness gate (`pnpm sprint4:gate`)
- Negative testing for legacy auth rejection
- Clear runbook for activation

**Gaps:**
- Missing token refresh/rotation strategy
- No rate limiting on auth endpoints
- Missing audit log for failed auth attempts

**Key Files:**
- `services/leads/src/admin-api.guard.ts`
- `services/partner/src/partner-auth.guard.ts`
- `docs/oidc-rollout-sprint4.md`

### 6.2 Authorization (RBAC)

**Ownership-Based Access Control:**

| Resource | Rule | Enforcement |
|----------|------|-------------|
| Partner leads | Partner must own venue via approved claim | `partner-claims.service.ts` validates ownership |
| Admin operations | OIDC token with admin scope | `admin-api.guard.ts` |
| Internal APIs | Shared secret token | `internal-api.guard.ts` |

**Audit Trail:**
- Ownership revocations logged to `PartnerOwnershipAuditEntity`
- Actor, reason, timestamp captured
- Admin UI exposes audit history

**Gaps:**
- No fine-grained permissions (e.g., read-only admin)
- Missing role hierarchy (super-admin vs operator)

---

## 7. Operational Resilience

### 7.1 Error Handling Patterns

**Notification Queue (Leads Service):**
- Persistent queue in SQLite
- Exponential backoff retry (configurable attempts/delay)
- Dead Letter Queue (DLQ) with operational UI
- Admin retry endpoint for failed deliveries

**Catalog Sync (Partner Service):**
- Transactional outbox pattern
- Retry queue with DLQ
- Admin endpoints for inspection and manual retry
- Health checks expose queue depth

**Strengths:**
- No silent failures; all errors surfaced to operators
- Self-healing with automatic retries
- Manual intervention path for edge cases

**Gaps:**
- No alerting/monitoring integration (Prometheus, Datadog)
- Missing SLOs for queue processing time
- No circuit breaker for upstream service failures

### 7.2 Health Checks

**Implemented:**
- `/health` on all services
- Partner service exposes:
  - Auth mode (OIDC vs fallback)
  - Queue health (catalogSync, catalogSyncOutbox)
  - Readiness recommendation (`recommendedForStrictOidc`)

**Gaps:**
- No liveness vs readiness distinction
- Missing dependency health (Postgres, external APIs)
- No health aggregation in BFF

---

## 8. Testing Strategy

### 8.1 Test Coverage

| Type | Location | Tools | Status |
|------|----------|-------|--------|
| Unit | `apps/web/src/lib/*.spec.ts` | Node test runner | ✅ Basic coverage |
| Integration | `services/catalog/test/*.spec.ts` | NestJS testing + Testcontainers | ✅ Capability tests |
| Contract | `tests/contracts/*.test.ts` | OpenAPI validation | ✅ Contract validation |
| E2E | `apps/web/e2e/*.spec.ts` | Playwright | ✅ Smoke tests |

**Test Commands:**
```bash
pnpm test:unit          # Unit tests
pnpm test:integration   # Integration tests with Testcontainers
pnpm test:contract      # OpenAPI contract tests
pnpm test:e2e          # Playwright E2E tests
pnpm test:capability    # Full test suite
```

**Strengths:**
- Multi-layer testing pyramid
- Testcontainers for realistic integration tests
- E2E tests run in CI with services
- Contract tests validate OpenAPI compliance

**Gaps:**
- Low unit test coverage in services
- Missing load/performance tests
- No chaos engineering tests
- E2E tests not run against staging

### 8.2 Quality Gates

**Pre-merge:**
```bash
pnpm verify  # lint + typecheck + build
```

**Sprint 4 Gate:**
```bash
pnpm sprint4:gate  # readiness + auth-negative tests
```

**Sprint 5 Gate:**
```bash
pnpm sprint5:kpi-gate       # KPI threshold validation
pnpm sprint5:flow-checklist # Service availability checks
```

---

## 9. Development Experience (DX)

### 9.1 Monorepo Structure

**Tool:** pnpm workspaces

**Strengths:**
- Single `pnpm install` for entire codebase
- Workspace protocol for internal packages
- Parallel script execution (`pnpm --parallel`)
- Consistent tooling (TypeScript 5, ESLint 9, Node 20+)

**Package Organization:**

```
/workspace
├── apps/
│   └── web/                 # Next.js app (@floit/web)
├── services/
│   ├── catalog/             # @floit/catalog-service
│   ├── search/              # @floit/search-service
│   ├── leads/               # @floit/leads-service
│   ├── partner/             # @floit/partner-service
│   └── analytics/           # @floit/analytics-service
├── packages/
│   ├── contracts/           # @floit/contracts (TS types)
│   └── ui/                  # @floit/ui (React components)
├── openapi/                 # OpenAPI 3.1 specs
├── contracts/events/        # JSON Schema event contracts
├── docs/                    # ADRs, sprints, runbooks
└── scripts/                 # Smoke tests, gates
```

### 9.2 Local Development Workflow

**Setup:**
```bash
pnpm docker:up              # Start Postgres
# Configure .env files (see docs/env/local.example)
pnpm dev:services           # Start all services (ports 4010-4014)
pnpm dev                    # Start Next.js (port 3000)
```

**Verification:**
```bash
pnpm smoke:local            # Smoke test local services
pnpm verify                 # Lint + typecheck + build
pnpm test:e2e              # E2E tests (requires services running)
```

**Strengths:**
- Single command to start all services
- Docker Compose for Postgres + PostGIS
- Clear environment variable examples
- Automated smoke tests

**Gaps:**
- No hot reload for service-to-service changes
- Missing Docker Compose for full stack (web + services)
- No unified log aggregation for local dev

### 9.3 Documentation Quality

**Strengths:**
- Comprehensive `AGENTS.md` for AI agent context
- ADR for architectural decisions (`docs/adr/`)
- Sprint documentation with traceability (`docs/sprints.md`)
- Alignment matrix (`docs/ALIGNMENT_SPRINTS_0_4.md`)
- Cursor rules for consistent code generation (`.cursor/rules/*.mdc`)
- Runbooks for operations (`docs/oidc-rollout-sprint4.md`)

**Gaps:**
- Missing API documentation generation from OpenAPI
- No architecture diagrams (C4 model recommended)
- Missing troubleshooting guide
- No contributing guide for new developers

---

## 10. Deployment & Infrastructure

### 10.1 Current State

**Observed:**
- No deployment configuration found (Dockerfile, Kubernetes, etc.)
- No CI/CD pipelines (GitHub Actions, GitLab CI)
- No infrastructure as code (Terraform, Pulumi)

**CI Workflow:**
- `.github/workflows/ci.yml` runs lint, typecheck, build, E2E tests
- Services started in CI for E2E tests

### 10.2 Production Readiness Gaps

| Area | Status | Recommendation |
|------|--------|----------------|
| **Containerization** | ❌ Missing | Add Dockerfiles for each service + web |
| **Orchestration** | ❌ Missing | Kubernetes manifests or Docker Compose production |
| **Config Management** | ⚠️ Env files | Migrate to secret manager (Vault, K8s secrets) |
| **Database Migrations** | ⚠️ TypeORM sync | Use TypeORM migrations for production |
| **Observability** | ❌ Missing | Add OpenTelemetry, Prometheus, Grafana |
| **Log Aggregation** | ❌ Missing | ELK stack or managed solution (Datadog, New Relic) |
| **CDN** | ❌ Missing | CloudFlare or Vercel for Next.js static assets |
| **Load Balancing** | ❌ Missing | NGINX or cloud load balancer |

---

## 11. Observability & Monitoring

### 11.1 Current State

**Implemented:**
- Health endpoints (`/health`) on all services
- Manual smoke tests (`scripts/smoke-local.mjs`)
- E2E tests capture errors

**Missing:**
- Structured logging (JSON format, correlation IDs)
- Distributed tracing (OpenTelemetry, Jaeger)
- Metrics collection (Prometheus)
- Dashboards (Grafana)
- Error tracking (Sentry, Rollbar)
- Alerting (PagerDuty, Opsgenie)

### 11.2 Recommendations

**Immediate (Sprint 6):**
1. Add structured logging library (pino, winston)
2. Correlation IDs across service calls
3. Sentry for error tracking
4. Uptime monitoring (UptimeRobot, Pingdom)

**Short-term:**
1. OpenTelemetry instrumentation
2. Prometheus metrics exporter
3. Grafana dashboards for funnel, SLA, queue depth

**Long-term:**
1. Distributed tracing with Jaeger/Zipkin
2. Log aggregation with ELK or Loki
3. SLO/SLA tracking and alerting

---

## 12. Performance & Scalability

### 12.1 Current Performance Characteristics

**Strengths:**
- Next.js with React Server Components (reduced client JS)
- Stateless search service (horizontal scaling ready)
- Database indexes on catalog (PostGIS spatial indexes)

**Bottlenecks:**
- SQLite for leads/partner/analytics (write contention at scale)
- No caching layer (Redis)
- Synchronous notification delivery (queue processing in-process)
- No CDN for static assets

### 12.2 Scalability Recommendations

**Database:**
- Migrate SQLite services to Postgres with connection pooling
- Add read replicas for catalog service
- Consider sharding for analytics events

**Caching:**
- Redis for:
  - Search results (5-minute TTL)
  - Venue profiles (stale-while-revalidate)
  - Session storage for BFF

**Async Processing:**
- Move queue processing to separate workers
- Use external message broker (NATS, RabbitMQ, SQS)
- Consider Temporal/Inngest for durable workflows

**CDN:**
- CloudFlare or Vercel for Next.js static assets
- Image optimization with Next.js Image API + CDN

---

## 13. Security Posture

### 13.1 Current Security Controls

**Implemented:**
- HTTPS assumed (not enforced in code)
- OIDC authentication with JWT validation
- RBAC with ownership checks
- Throttling on lead submission (12 req/min)
- Turnstile (Cloudflare) for bot protection
- Client IP tracking for abuse detection
- Audit logs for ownership changes
- SQL injection protection via TypeORM parameterized queries
- XSS protection via React (auto-escaping)

### 13.2 Security Gaps & Recommendations

**High Priority:**
1. **Secrets Management:** Migrate from `.env` to Vault or K8s secrets
2. **Rate Limiting:** Add rate limiting on all public endpoints (not just leads)
3. **CSRF Protection:** Add CSRF tokens for state-changing operations
4. **Content Security Policy:** Add CSP headers to Next.js
5. **Dependency Scanning:** Add Snyk or Dependabot

**Medium Priority:**
1. **API Keys Rotation:** Implement rotation for internal API tokens
2. **Data Encryption:** Encrypt sensitive fields at rest (PII in leads)
3. **GDPR Compliance:** Add data retention policies, right to deletion
4. **Penetration Testing:** Third-party security audit before production

**Low Priority:**
1. **WAF:** Add Web Application Firewall (CloudFlare, AWS WAF)
2. **DDoS Protection:** CloudFlare or cloud-native DDoS protection

---

## 14. Code Quality & Maintainability

### 14.1 Code Quality Metrics

**Strengths:**
- TypeScript strict mode enabled
- Consistent ESLint configuration
- Clear separation of concerns (controllers, services, entities)
- DTOs for validation (class-validator)
- Cursor rules for AI-assisted development

**Observations:**
- Low cyclomatic complexity (simple functions)
- Minimal tech debt (new codebase)
- Good naming conventions (descriptive, consistent)

### 14.2 Technical Debt

**Current Debt:**
1. SQLite for production-critical services (leads, partner)
2. In-process queue processing (partner catalog sync, lead notifications)
3. OIDC fallback auth modes (legacy `x-admin-token`, dev `x-partner-email`)
4. No automated database migrations (using TypeORM sync)
5. Missing comprehensive unit tests

**Debt Prioritization:**
1. **Critical:** Migrate SQLite → Postgres (data durability)
2. **High:** Remove OIDC fallback modes (security)
3. **Medium:** External event broker (scalability)
4. **Low:** Increase unit test coverage (quality)

---

## 15. Compliance & Privacy (GDPR/LOPD)

### 15.1 Current State

**Implemented:**
- Consent tracking (`consentAccepted`, `consentVersion`)
- Privacy policy page (`/privacidad`)
- Data minimization (only essential fields in lead form)

**Missing:**
- Right to access (user data export)
- Right to deletion (GDPR Article 17)
- Right to rectification
- Data retention policies
- Cookie consent banner
- Privacy policy update notifications
- Data processing agreement (DPA) for partners
- LOPD compliance for Venezuela-specific regulations

### 15.2 Recommendations

1. Implement user data deletion endpoint
2. Add data retention scheduler (delete old analytics events, leads)
3. Cookie consent management (OneTrust, Cookiebot)
4. Privacy-by-design review for new features
5. Legal review for Venezuela LOPD compliance

---

## 16. Alignment with PRD & Backlog

### 16.1 PRD Alignment: **9/10**

**Strengths:**
- Core MVP scope maintained (discovery, comparison, lead marketplace)
- Partner panel lite delivered
- No scope creep into complex payments/reservations
- Mobile-first responsive design
- Focus on lead quality over volume

**Gaps:**
- Missing A/B experiment framework (partially implemented in Sprint 5)
- Partner SLA metrics not fully surfaced to partners
- Limited UGC/reviews (editorial only)

### 16.2 Backlog Alignment: **8/10**

**Delivered:**
- Epic 1-2: Discovery, search, comparison ✅
- Epic 3: Lead generation, confirmation ✅
- Epic 4: Partner claim, profile, plans, inbox ✅
- Epic 5: Admin operations ✅
- Epic 6: Analytics, funnel tracking ✅ (partial experiments)
- Epic 7: Trust, security, anti-spam ✅
- Epic 8: Mobile-first, SEO, CI/E2E ✅

**Pending:**
- Advanced A/B experimentation
- Partner metrics dashboard (response time, conversion)
- UGC moderation tools

---

## 17. Sprint Progress Assessment

### Sprint Status

| Sprint | Status | Completeness | Key Gaps |
|--------|--------|--------------|----------|
| Sprint 0 (Foundations) | ✅ Complete | 100% | None |
| Sprint 1 (Discovery) | ✅ Complete | 100% | None |
| Sprint 2 (Conversion) | ✅ Complete | 100% | None |
| Sprint 3 (Operations) | ✅ Complete | 100% | None |
| Sprint 4 (Hardening) | ⚠️ Technical Complete | 95% | OIDC-only activation in staging/prod, external event broker |
| Sprint 5 (Analytics) | 🔄 In Progress | 80% | Full A/B evaluation, staging evidence |

### Sprint 4 Closure Checklist

**Completed:**
- ✅ Notification queue with DLQ/retry
- ✅ Catalog sync with outbox phase 1
- ✅ OIDC implementation with gradual rollout
- ✅ RBAC with ownership validation
- ✅ Audit trail for ownership changes
- ✅ Health endpoints with readiness checks
- ✅ Automated gates (`pnpm sprint4:gate`)

**Pending:**
- ⏳ Execute OIDC-only rollout in staging
- ⏳ Complete `docs/STAGING_EVIDENCE_SPRINT4.md`
- ⏳ Activate `ADMIN_AUTH_REQUIRE_OIDC=true` in staging/prod
- ⏳ Connect outbox to external broker (NATS/Rabbit/SQS)

---

## 18. Architecture Decision Records (ADRs)

### Existing ADRs

**ADR-001: Monorepo and Bounded Contexts**
- **Decision:** pnpm monorepo with NestJS microservices per bounded context
- **Status:** Accepted (2026-04-22)
- **Rationale:** Clear ownership, independent deployability, CI per package
- **Consequences:** Operational overhead, need for service mesh/API gateway

### Recommended Additional ADRs

1. **ADR-002: Database Strategy (Postgres vs SQLite)**
   - Decision on production database choices
   - Migration path from SQLite

2. **ADR-003: Event-Driven Architecture**
   - Broker selection (NATS vs RabbitMQ vs SQS)
   - Event schema governance

3. **ADR-004: Authentication & Authorization**
   - OIDC provider selection
   - Token lifecycle management

4. **ADR-005: Observability Stack**
   - Logging, metrics, tracing tooling choices

5. **ADR-006: Deployment Strategy**
   - Kubernetes vs serverless vs VMs
   - CI/CD pipeline design

---

## 19. Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **SQLite data loss in production** | High | Medium | Migrate to Postgres before production launch |
| **OIDC fallback auth misuse** | High | Low | Complete OIDC-only rollout, remove fallbacks |
| **Queue processing bottleneck** | Medium | High | Move to external broker, separate workers |
| **Service discovery complexity** | Low | Low | Implement service mesh or API gateway |
| **Vendor lock-in (Turnstile, OIDC)** | Medium | Low | Abstract behind interfaces, document alternatives |
| **GDPR non-compliance** | High | Medium | Implement data deletion, retention policies |
| **Performance degradation at scale** | Medium | Medium | Add caching, CDN, database optimization |
| **Security breach** | High | Low | Secrets management, penetration testing, WAF |

---

## 20. Recommendations

### Immediate (Before Production)

1. **Database Migration:** SQLite → Postgres for leads, partner, analytics
2. **OIDC-Only Activation:** Complete rollout, remove fallback auth modes
3. **Secrets Management:** Migrate from `.env` to Vault or K8s secrets
4. **Observability:** Add Sentry, structured logging, basic metrics
5. **Deployment:** Create Dockerfiles, Kubernetes manifests
6. **GDPR:** Implement data deletion endpoint

### Short-term (Next 2 Sprints)

1. **Event Broker:** Connect outbox to NATS/RabbitMQ
2. **Caching Layer:** Add Redis for search results, venue profiles
3. **CDN:** CloudFlare for static assets
4. **Rate Limiting:** Protect all public endpoints
5. **Monitoring:** Prometheus + Grafana dashboards
6. **Load Testing:** Identify bottlenecks before traffic spike

### Long-term (Post-MVP)

1. **Service Mesh:** Istio or Linkerd for observability, security
2. **API Gateway:** Kong or AWS API Gateway for unified ingress
3. **Advanced Analytics:** TimescaleDB or ClickHouse for events
4. **Multi-region:** Deploy in multiple AZs/regions
5. **GraphQL Federation:** Unify service APIs for BFF
6. **Real-time:** WebSockets for live notifications

---

## 21. Conclusion

### Overall Assessment: **Strong Foundation, Production-Ready with Fixes**

**What's Working Well:**
- Clean bounded context architecture
- Contract-first API design
- Progressive enhancement from MVP to production features
- Strong operational patterns (DLQ, retry, outbox)
- Comprehensive documentation and sprint tracking

**Critical Path to Production:**
1. Migrate SQLite → Postgres
2. Complete OIDC-only rollout
3. Add observability (Sentry, metrics, logs)
4. Containerize and deploy to staging
5. Security review and GDPR compliance
6. Load testing and performance tuning

**Architecture Maturity Trajectory:**

```
Current State: 7.5/10 (MVP-ready)
  ↓
+ Production Database: 8.0/10
  ↓
+ Observability + Secrets: 8.5/10
  ↓
+ Event Broker + Caching: 9.0/10
  ↓
+ Service Mesh + Multi-region: 9.5/10
```

The Floit architecture demonstrates excellent engineering discipline for an early-stage MVP. The team has made sound technical decisions, maintained alignment with product goals, and built a scalable foundation. With focused effort on production readiness (database, observability, deployment), this system is well-positioned for a successful launch and gradual scaling.

---

**Next Steps:**
1. Review this document with the engineering team
2. Prioritize recommendations based on launch timeline
3. Create ADRs for pending architectural decisions
4. Schedule production readiness sprint
5. Conduct security review with external auditor

**Document Version:** 1.0  
**Last Updated:** 2026-04-26  
**Maintained By:** Floit Engineering Team
