# Recommended Next-Milestones Roadmap

Date: 2026-05-25
Context baseline: v0.1-foundation-stable

## Planning Principle
Prioritize operational safety first (deployment and migrations), then security controls, then product acceleration layers (AI, notifications, reporting).

## Milestone 1: Deployment Readiness
Objective:
- Establish deterministic and reversible deployment flow.

Work items:
- Define environment matrix (local, staging, production) and required secrets.
- Add CI pipeline gates: install, lint, type-check, tests, build.
- Add deploy smoke checks for core routes and auth.
- Create release checklist and rollback checklist.

Exit criteria:
- One-command CI validation on pull request.
- Repeatable staging deployment with smoke check pass.
- Documented rollback executed successfully in staging.

## Milestone 2: Database Migrations
Objective:
- De-risk schema evolution and data integrity under production load.

Work items:
- Generate and review Prisma migrations for enum and procurement changes.
- Define backfill scripts for status/category normalization.
- Add migration preflight validation and post-migration assertions.
- Create backup/restore drill for migration windows.

Exit criteria:
- Migration dry-run successful against production-like snapshot.
- Backfill idempotency validated.
- Documented go/no-go checklist with rollback trigger points.

## Milestone 3: Permissions and Security
Objective:
- Enforce role-based access and harden sensitive operations.

Work items:
- Audit action and service entry points for role authorization.
- Add permission matrix by module (CRM, Projects, Financials, Suppliers, AI).
- Introduce centralized authorization guards and audit logging.
- Review session handling and token lifecycle policies.

Exit criteria:
- Permission matrix implemented and tested for critical endpoints.
- Security review completed for auth/session/data access paths.
- Unauthorized access test cases pass.

## Milestone 4: AI Layer Hardening
Objective:
- Move AI features from utility mode to production-safe mode.

Work items:
- Define AI request budget and throttling controls.
- Add prompt and output governance for sensitive domains.
- Add observability: latency, failure rates, token/cost tracking.
- Build fallback paths when AI provider is unavailable.

Exit criteria:
- AI calls protected by quota, timeout, and fallback logic.
- Monitoring dashboard for AI reliability and cost in place.
- No critical user flow blocked by AI outages.

## Milestone 5: Notifications
Objective:
- Provide reliable user-facing operational awareness.

Work items:
- Normalize notification event taxonomy.
- Implement delivery channels (in-app first, optional email next).
- Add read/unread lifecycle and notification preference controls.
- Add deduplication for noisy event streams.

Exit criteria:
- Notification delivery and read-state flows pass integration tests.
- Duplicate/noise rate reduced to acceptable threshold.
- User preference controls operational.

## Milestone 6: Reporting and Analytics
Objective:
- Deliver trustworthy reporting for business decisions and operations.

Work items:
- Define canonical KPI set by module.
- Add materialized/query-efficient reporting endpoints.
- Add export paths and scheduled report jobs (if needed).
- Add data quality checks and reconciliation jobs.

Exit criteria:
- KPI definitions approved and traceable to source data.
- Reporting endpoints meet latency targets.
- Reconciliation checks pass on staging and production.

## Suggested Execution Order
1. Deployment Readiness
2. Database Migrations
3. Permissions and Security
4. AI Layer Hardening
5. Notifications
6. Reporting and Analytics

## Risk Register (Top)
- Schema migration regressions under real-world data diversity.
- Security drift across new action/service endpoints.
- AI cost and reliability variance without hard quotas.
- Reporting trust gap without reconciliation checks.

## Governance
- Treat each milestone as a release candidate with explicit go/no-go.
- Require checklist signoff from engineering lead and product owner.
- Maintain a rolling risk log and post-milestone retrospective.
