# Repository Safety Snapshot

Date: 2026-05-25
Baseline commit: a2e4237
Stability tag target: v0.1-foundation-stable

## Scope
This document captures a non-behavioral architecture and stability snapshot for milestone finalization.

## Modules
Feature modules under src/features:
- ai
- crm
- dashboard
- finances
- financials
- projects
- suppliers

Action modules under src/actions:
- auth.ts
- clients.ts
- crm.ts
- financials.ts
- projects.ts
- suppliers.ts
- workflows.ts

Cross-cutting layers:
- App routes and composition in src/app
- Server services in src/services
- Prisma persistence schema in prisma/schema.prisma

## Routes
### App shell routes
- /
- /dashboard
- /crm
- /crm/[clientId]
- /projects
- /projects/[projectId]
- /finances
- /suppliers
- /suppliers/[supplierId]
- /ai

### Auth routes
- /login
- /register

### API routes
- /api/auth/[...nextauth]

## Services
Service files under src/services:
- activity.service.ts
- ai.service.ts
- clients.service.ts
- dashboard.service.ts
- files.service.ts
- finances.service.ts
- financials.service.ts
- meetings.service.ts
- projects.service.ts
- suppliers.service.ts

Current observation:
- finances.service.ts and financials.service.ts coexist, indicating a transitional split between legacy and normalized financial domain naming.

## Prisma Models
From prisma/schema.prisma:
- Account
- Session
- VerificationToken
- User
- Client
- Project
- ProjectMember
- Invoice
- Supplier
- Task
- Meeting
- MeetingAttendee
- ClientNote
- Attachment
- ProjectComment
- ProjectSupplier
- Expense
- ProcurementRequest
- ProcurementQuote
- Notification
- ActivityEvent

## Tests
Current automated tests discovered in source tree:
- src/actions/crm.test.ts
- src/features/crm/validation.test.ts
- src/features/projects/validation.test.ts
- src/features/financials/validation.test.ts
- src/features/suppliers/validation.test.ts

Coverage characterization:
- Strong validation coverage in CRM, Projects, Financials, Suppliers.
- Limited service-level integration tests and end-to-end route tests.

## Technical Debt
1. Next.js middleware convention deprecation
- Current warning indicates middleware should migrate to proxy convention in a future hardening pass.

2. Financial domain naming convergence
- Both finances and financials namespaces exist and should be consolidated to reduce ambiguity.

3. Migration/backfill procedure documentation gap
- Schema has evolved with stronger enums and procurement models; explicit migration/backfill runbooks are still needed.

4. Testing depth
- Validation tests are present, but integration and e2e coverage is still below production-grade confidence.

## Deployment Readiness
Status: Conditionally ready.

Signals in favor:
- Lint passes.
- Build passes.
- Tests pass (current suite).
- Repository baseline was clean at snapshot start.

Pre-deploy gates still recommended:
1. Validate Prisma migration plan on staging with production-like data.
2. Add rollback plan for enum conversions and new procurement entities.
3. Resolve framework deprecation warning before long-lived release branch.
4. Add smoke checks for critical flows: auth, CRM, projects, finances, suppliers.

## Safety Notes
- This snapshot does not change runtime behavior.
- Intended use: milestone freeze, audit handoff, and release readiness review.
