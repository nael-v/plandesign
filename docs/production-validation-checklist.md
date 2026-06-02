# PlanDesign Production Validation Checklist

Status target: move from Deployment Successful to Production Validated.

## Scope

This checklist validates:
- Authentication and route protection
- Dashboard data integrity
- CRUD connectivity to Supabase
- Core services: Projects, Clients, Suppliers, Meetings, Files, Finances
- Runtime health and logs in Vercel
- Gaps where UI/features are not yet fully DB-backed

## Guardrails

- Do not run Prisma migrations unless a blocking schema issue is confirmed.
- Do not change Prisma schema during validation.
- Do not modify Vercel environment variables unless a clear root cause requires it.

## Prerequisites

- Production URL reachable: https://plandesign-rose.vercel.app
- A test user exists (or can be created via register flow)
- Browser session can open both anonymous and authenticated states
- Vercel project access with Logs and Runtime visibility
- Supabase project access to verify rows (read-only checks preferred)

## Test Run Metadata

Fill before execution:
- Date:
- Tester:
- App version (commit SHA):
- Environment: Production
- Browser:

## 1) Authentication Validation

### 1.1 Login flow
- Open /login from logged-out state.
- Sign in with valid credentials.
- Expected:
  - Redirect to /dashboard
  - No 500/Runtime errors
  - Session persists on refresh

### 1.2 Invalid credentials
- Submit invalid password.
- Expected:
  - Friendly error message
  - No crash
  - No session created

### 1.3 Protected routes
- From logged-out state, request each route directly:
  - /dashboard
  - /crm
  - /projects
  - /finances
  - /suppliers
  - /ai
- Expected:
  - Redirect to /login with callbackUrl

### 1.4 Auth pages for logged-in user
- While logged in, open /login and /register.
- Expected:
  - Redirect to /dashboard

Pass/Fail: ___
Notes:

## 2) Dashboard Validation

### 2.1 Page load and summary cards
- Open /dashboard after login.
- Expected:
  - Page renders without hydration/runtime errors
  - Snapshot metrics load (even if values are zero)

### 2.2 Meetings and notifications widgets
- Verify notifications and meetings sections render.
- Expected:
  - No component crash
  - Empty state or data state appears correctly

### 2.3 Locale and direction
- Switch language EN <-> HE from top bar.
- Expected:
  - Text direction toggles LTR/RTL
  - Content labels update where localized

Pass/Fail: ___
Notes:

## 3) CRUD Validation Against Supabase

Run one end-to-end cycle per module:
- Create
- Read/List
- Update
- Delete (or soft-delete if business rules require retention)

Record entity IDs created for traceability.

### 3.1 Clients (CRM)
- Create client
- Edit key fields
- Open client profile workspace
- Add note and validate timeline event
- Delete client (if supported)
- Expected:
  - UI reflects changes immediately
  - Data persists after refresh

### 3.2 Projects
- Create project
- Move status/stage fields
- Open project workspace
- Add comments/tasks/files where applicable
- Delete project (if supported)
- Expected:
  - Table and detail views stay consistent

### 3.3 Suppliers
- Create supplier
- Update supplier info
- Open supplier workspace
- Create procurement request and update status flow
- Expected:
  - Status transitions persist
  - Supplier/project linkage visible

### 3.4 Meetings
- Create/schedule meeting from available UI points
- Validate list and reminder visibility
- Expected:
  - Meeting appears in dashboard/workspace lists
  - Date/time formatting is valid for locale

### 3.5 Files
- Upload representative file types (image/pdf)
- Validate list rendering and metadata
- Optional delete/replace action if supported
- Expected:
  - Upload completes without runtime error
  - File references persist and render

### 3.6 Finances
- Create invoice
- Update invoice status
- Create expense
- Validate supplier payments view/actions
- Expected:
  - Cards, tables, and timeline update correctly
  - Monetary values render consistently

Pass/Fail: ___
Notes:

## 4) Runtime Errors on Vercel

### 4.1 Runtime log scan
- In Vercel, inspect Functions/Runtime logs during active test session.
- Look for:
  - 500 errors
  - Prisma connection issues
  - Auth secret/config issues
  - Edge/runtime incompatibility

### 4.2 Build/deploy health
- Verify latest deployment status remains Ready.
- Confirm no post-deploy crash loops.

Pass/Fail: ___
Notes:

## 5) Supabase Data Verification (Read-Only)

For every CRUD test above, verify rows changed in the relevant tables.
- Validate created_at / updated_at behavior
- Validate foreign keys for linked entities
- Validate no orphaned rows from failed operations

Pass/Fail: ___
Notes:

## 6) Feature-to-DB Coverage Audit

Goal: identify features not fully connected to DB yet.

For each module page/workspace:
- Mark as DB-backed, partially DB-backed, or mock/placeholder
- List missing actions (create/update/delete/list)
- Note any local-only optimistic updates that are not persisted

Template:
- Module:
- Feature:
- Current state:
- Missing DB integration:
- Priority: High/Medium/Low

## 7) Exit Criteria

Production Validated can be declared when:
- Auth checks pass
- Dashboard pass
- CRUD passes in all required modules
- No blocking runtime errors in Vercel
- Feature-to-DB gaps are listed with priority and owner

## Validation Report Template

- Validation date:
- Tester:
- Commit SHA:
- Result: PASS / PASS WITH ISSUES / FAIL
- Blocking issues:
- Non-blocking issues:
- Feature-to-DB gaps:
- Recommended next action:
