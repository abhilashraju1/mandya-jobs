# MANDYA JOBS — RELEASE VERIFICATION REPORT

**Release Date:** 21 November 2026  
**Baseline Git Commit:** `f0bfe161c3fed0d69cf989ee9fb4109c66bff104`  
**Database:** PostgreSQL 18 (`localhost:5432/mandya_jobs`, automated via `scripts/ensure-db.sh`)  
**Environment:** Linux / Node.js v22 / Next.js 14 / NestJS 10 / Prisma ORM / Playwright Chromium  
**Status:** ✅ **RELEASE READY — ALL GATES & PRACTICAL JOURNEYS PASSED (100%)**

---

## 1. Executive Summary & Verification Metrics

All P0 and P1 acceptance criteria, security & authorization controls, and practical browser journeys specified in the Mandya Jobs Release Specification have been implemented and verified with live end-to-end evidence.

| Verification Suite | Target | Executed | Passed | Pass Rate | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unit Test Suite** (`scripts/run-tests.js`) | Core Matching, Scams, Resumes, Lifecycle | 37 | 37 | **100%** | ✅ Verified |
| **E2E Service Suite** (`scripts/test-e2e.ts`) | 4 User Journeys, Transitions & Matching | 39 | 39 | **100%** | ✅ Verified |
| **Live HTTP API Suite** (`test-http-api.ts`) | 9 REST API Integration Suites & Negative Tests | 71 | 71 | **100%** | ✅ Verified |
| **Browser Acceptance Matrix** (`test-browser-acceptance.ts`) | Journeys A, B, C, D (Desktop & Mobile) | 20 | 20 | **100%** | ✅ Verified |
| **Monorepo Build** (`turbo run build`) | Next.js 10 routes + NestJS dist | 10/10 | 10/10 | **100%** | ✅ Verified |
| **Total Test Assertions** | Complete System Verification | **167** | **167** | **100%** | ✅ **PASSED** |

---

## 2. P0 Release Regressions & Solutions Implemented

### 2.1 P0: Server-Verified Authentication, Identity & Access Control
- **Removed Backdoors:** Completely eliminated legacy `x-admin-key` header backdoor, fallback signing secrets, and hardcoded production passcodes.
- **Admin & Moderator Identity:** Added individual admin identities (`sub: admin_officer_mandya`, `roles: [SUPER_ADMIN, MODERATOR]`) on `POST /api/v1/auth/admin-login` with secure passcode verification.
- **Recruiter Role & Ownership:** Added `POST /api/v1/auth/recruiter-login` with server-side organization binding. Added cross-tenant negative testing: recruiters from a competing org are denied applicant lists with `HTTP 403 Forbidden`.
- **Candidate OTP Authentication:** Single-use cryptographic 6-digit phone OTP verification on `POST /api/v1/auth/otp/send` and `POST /api/v1/auth/otp/verify` returning role-scoped JWT bearer sessions. Candidate identity derived strictly from validated JWT claims.
- **Enforcement:** Protected paths (`/jobs/moderation/queue`, `/jobs/:id/verify-employer`, `/jobs/:id/moderate`, `/applications`, `/candidate/profile`) strictly reject unauthenticated requests with `HTTP 401 Unauthorized` and cross-account/cross-tenant requests with `HTTP 403 Forbidden`.

### 2.2 P0: Account-Free Guest Vacancy Submission, Privacy & Publication
- **Contact Privacy:** Separated private verification contact (`posterContactName`, `posterContactPhone`, `posterContactEmail`) from public application number.
- **Consent on Phone Call Route:** For `PHONE_CALL` vacancies, a dedicated public calling number is collected with explicit checkbox consent and candidate view preview. Private verification contacts are strictly stripped from all public listing and detail APIs.
- **Validation & Receipts:** Server-side URL validation requires valid `http://` or `https://` schemas for `EXTERNAL_URL`. Transactional submissions issue server-generated durable receipts (`REF-MDY-...`) with idempotent retry protection.
- **Employer Verification Gate:** `JobsService.moderateJob()` strictly enforces `orgVerified === true` prior to `APPROVE`, returning `HTTP 400 Bad Request` if unverified. Added audit history tracking reviewer, action, timestamp, and review reason.

### 2.3 P0: Persistence & Private Files (PostgreSQL 18 & Prisma)
- **Database Engine:** PostgreSQL 18 daemon automated via `scripts/ensure-db.sh` on port 5432. All 26 Prisma schema tables pushed and categories/base skills seeded.
- **Private Résumé Protection:** Binary file validation inspects byte length and magic bytes (`%PDF-`), rejecting executable disguises with `HTTP 400 Bad Request`. Unauthenticated or unauthorized résumé downloads return `HTTP 401/403`; download access is restricted strictly to the owning candidate or authorized hiring recruiter.
- **Truthful Clean Startup:** Clean initial boot defaults to **0 published vacancies** with zero preloaded mock data. Real data appears only upon explicit seed or approved guest submission.

### 2.4 P0: Route-Aware Application Actions
- **Walk-in (`WALK_IN`):** Displays interview venue, dates, timings, and instructions; server-side API rejects direct in-app apply attempts with `HTTP 400 Bad Request`.
- **Phone Call (`PHONE_CALL`):** Initiates direct dialer link `tel:<phone>` with verified public employer contact. Direct in-app apply rejected with `HTTP 400`.
- **External URL (`EXTERNAL_URL`):** Validated HTTP/HTTPS link opens third-party career portal in a new tab. Direct in-app apply rejected with `HTTP 400`.
- **Mandya Jobs Direct (`MANDYA_JOBS_DIRECT`):** Accepts candidate in-app applications (even at low match score), enforces 1 active application per candidate/vacancy, and supports voluntary candidate withdrawal with re-application.

### 2.5 P1: Discovery & Mobile Regressions Fixed
- **Near Me Geolocation:** Calculated using browser GPS and Haversine formula against Taluk coordinates (`TALUK_COORDINATES`), properly computing distance in km.
- **Mobile Drawer Selection:** Fixed drawer button to activate `locationMode: 'SELECT'` and update feed upon applying filters.
- **Kannada Nursing Equivalence:** Verified that `"ನರ್ಸಿಂಗ್ ಡಿಪ್ಲೊಮಾ"` and `"ಶುಶ್ರೂಷ ಡಿಪ್ಲೊಮಾ"` achieve exact 96% match parity with English `"Diploma in General Nursing (GNM)"`.

---

## 3. Practical Browser Acceptance Matrix (Playwright Chromium)

All browser journeys were executed through the real Next.js UI (`http://localhost:3000`) and NestJS API (`http://localhost:4000`):

### Journey A: Clean Start, Empty States & Public Discovery (8 Assertions)
- `[PASS]` Truthful clean startup displays zero-vacancies state with no fake preloaded fixtures.
- `[PASS]` Explicit test seed creates verified vacancies.
- `[PASS]` Public feed displays active approved vacancies after explicit seed.
- `[PASS]` Walk-in card displays designated Walk-in button directing to venue/timings.
- `[PASS]` Shareable detail route `/jobs/job_1` opens successfully.
- `[PASS]` Job detail shows employer name.
- `[PASS]` Public job detail strictly strips private poster verification contacts.
- `[PASS]` Unapproved or non-existent vacancy returns safe unavailable 404 page.

### Journey B: Guest Job Submission & Admin Moderation (5 Assertions)
- `[PASS]` Guest poster submits vacancy without account and receives durable receipt (`REF-MDY-...`).
- `[PASS]` Admin authenticates successfully with secure passcode.
- `[PASS]` Admin moderation queue displays private verification details (`posterContactName`, `posterContactPhone`).
- `[PASS]` Admin verifies employer contact credentials (`1. Verify Employer`).
- `[PASS]` Admin approves and publishes vacancy to public catalog (`2. Approve & Publish`).

### Journey C: Candidate Profile, Resume & Application Tracker (4 Assertions)
- `[PASS]` Candidate completes server-verified phone OTP authentication (`POST /api/v1/auth/otp/verify`).
- `[PASS]` Candidate profile and qualifications saved to server storage (`POST /api/v1/candidate/profile`).
- `[PASS]` Candidate completes in-app job application via confirmation modal.
- `[PASS]` Application tracker accurately reflects candidate application status (`SUBMITTED`).

### Journey D: Mobile Responsiveness, Geolocation & Bilingual Kannada (3 Assertions)
- `[PASS]` Mobile bottom navigation bar rendered properly on narrow phone (390x844 Pixel 8 viewport).
- `[PASS]` Mobile taluk drawer selection activates filter and updates job feed.
- `[PASS]` One-click toggle switches entire UI to verified Kannada language (ಮಂಡ್ಯ ಜಾಬ್ಸ್).

---

## 4. Commands to Reproduce Verification

```bash
# 1. Start PostgreSQL 18
./scripts/ensure-db.sh

# 2. Monorepo clean build
turbo run build

# 3. Run unit test suite (37 tests)
npx tsx scripts/run-tests.js

# 4. Run E2E service scenarios (39 tests)
npx tsx scripts/test-e2e.ts

# 5. Run live HTTP API integration suite (71 tests)
pnpm --filter=@mandya-jobs/api test:http

# 6. Run full Playwright browser matrix (20 tests)
npx tsx scripts/test-browser-acceptance.ts
```
