# MANDYA JOBS — RELEASE VERIFICATION REPORT

**Release Date:** 21 November 2026  
**Baseline Git Commit:** `a53a39cf8b51700a35c3a246135436c122315b82`  
**Environment:** Linux / Node.js v22 / Next.js 14 / NestJS 10 / Playwright Chromium  
**Status:** ✅ **RELEASE READY — ALL GATES & PRACTICAL JOURNEYS PASSED (100%)**

---

## 1. Executive Summary & Verification Metrics

All P0 and P1 acceptance criteria and practical browser journeys specified in the Mandya Jobs Release Specification have been implemented and verified with end-to-end evidence.

| Verification Suite | Target | Executed | Passed | Pass Rate | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unit Test Suite** (`scripts/run-tests.js`) | Core Matching, Scams, Resumes, Lifecycle | 37 | 37 | **100%** | ✅ Verified |
| **E2E Service Suite** (`scripts/test-e2e.ts`) | 4 User Journeys, Transitions & Matching | 39 | 39 | **100%** | ✅ Verified |
| **Live HTTP API Suite** (`test-http-api.ts`) | 8 REST API Integration Suites | 59 | 59 | **100%** | ✅ Verified |
| **Browser Acceptance Matrix** (`test-browser-acceptance.ts`) | Journeys A, B, C, D (Desktop & Mobile) | 20 | 20 | **100%** | ✅ Verified |
| **Monorepo Build** (`turbo run build`) | Next.js 10 routes + NestJS dist | 10/10 | 10/10 | **100%** | ✅ Verified |
| **Total Test Assertions** | Complete System Verification | **155** | **155** | **100%** | ✅ **PASSED** |

---

## 2. P0 Release Regressions & Solutions Implemented

### 2.1 P0: Server-Verified Authentication & Route Protection
- **Problem:** Moderation and operational actions lacked server-side authorization checks and relied on browser local state.
- **Implementation:** Added full server-side JWT / Admin Passcode verification on `POST /api/v1/auth/admin-login`, `POST /api/v1/auth/otp/send`, and `POST /api/v1/auth/otp/verify`.
- **Enforcement:** Protected paths (`/jobs/moderation/queue`, `/jobs/:id/verify-employer`, `/jobs/:id/moderate`, `/applications`) strictly reject unauthorized requests with `HTTP 401 Unauthorized` or `HTTP 403 Forbidden`.

### 2.2 P0: Employer Verification vs. Publication Approval Separation
- **Problem:** Moderation previously coupled employer verification directly to approval, allowing approval without verifying the hiring contact.
- **Implementation:**
  - Added dedicated endpoint `POST /api/v1/jobs/:id/verify-employer` which marks `orgVerified = true`.
  - Enforced in `JobsService.moderateJob()` that `APPROVE` requires `orgVerified === true`, returning `HTTP 400 Bad Request: Cannot approve vacancy before employer credentials and contact are verified.` if unverified.
  - Added durable moderation audit trail (`moderationHistory`) recording reviewer ID, action, timestamp, and review reason.

### 2.3 P0: Strict Public Allowlist & Contact Privacy
- **Problem:** Private poster contact info (`contactPhone`, `posterContactName`) risked leaking in public vacancy listings or detail views.
- **Implementation:**
  - `toPublicProjection()` strictly strips `posterContactName`, `posterContactPhone`, and `posterContactEmail`.
  - Public `contactPhone` is exposed **only if** `applicationRoute === 'PHONE_CALL'`.
  - Unapproved (`SUBMITTED`, `CHANGES_REQUESTED`, `REJECTED`) and expired vacancies return `HTTP 404 Not Found` to public callers while remaining visible in admin moderation.

### 2.4 P0: Disk Persistence Across Restarts & Clean 0-Vacancy Launch
- **Problem:** In-memory storage caused state loss upon restart and startup fixtures pre-populated vacancies.
- **Implementation:**
  - File-backed storage implemented in `apps/api/data/` (`jobs.json`, `applications.json`, `resumes.json`, `profiles.json`).
  - Fresh launch defaults to **0 published vacancies**; fixtures only populate via explicit test setup (`POST /jobs/seed`).
  - Survives complete API server restarts and independent client browser sessions.

### 2.5 P0: Route-Aware Application CTAs
- **Walk-in (`WALK_IN`):** Displays interview venue, dates, timings, and instructions; never creates fake in-app tracker entries.
- **Phone Call (`PHONE_CALL`):** Initiates direct dialer link `tel:<phone>`.
- **External URL (`EXTERNAL_URL`):** Validated link opens verified third-party career portal in new tab.
- **Mandya Jobs Direct (`MANDYA_JOBS_DIRECT`):** Accepts candidate in-app applications (even at low match score), enforces 1 active application per candidate/vacancy, and supports voluntary candidate withdrawal with re-application.

### 2.6 P1: Discovery & Mobile Regressions Fixed
- **Near Me Geolocation:** Calculated using browser GPS and Haversine formula against Taluk coordinates (`TALUK_COORDINATES`), properly computing distance in km.
- **Mobile Drawer Selection:** Fixed drawer button to activate `locationMode: 'SELECT'` and update feed upon applying filters.
- **Kannada Nursing Equivalence:** Verified that `"ನರ್ಸಿಂಗ್ ಡಿಪ್ಲೊಮಾ"` and `"ಶುಶ್ರೂಷ ಡಿಪ್ಲೊಮಾ"` achieve exact 96% match parity with English `"Diploma in General Nursing (GNM)"`.

---

## 3. Practical Browser Acceptance Matrix (Playwright Chromium)

All browser journeys were executed through the real Next.js UI (`http://localhost:3000`) and NestJS API (`http://localhost:4000`):

### Journey A: Clean Start, Empty States & Public Discovery (8 Assertions)
- `[PASS]` Truthful clean startup displays zero-vacancies state with no fake preloaded fixtures.
- `[PASS]` Explicit test seed creates 10 verified vacancies.
- `[PASS]` Public feed displays active approved vacancies after explicit seed.
- `[PASS]` Walk-in card displays designated Walk-in button directing to venue/timings.
- `[PASS]` Shareable detail route `/jobs/job_1` opens successfully.
- `[PASS]` Job detail shows employer name.
- `[PASS]` Public job detail strictly strips private poster verification contacts.
- `[PASS]` Unapproved or non-existent vacancy returns safe unavailable 404 page.

### Journey B: Guest Job Submission & Admin Moderation (5 Assertions)
- `[PASS]` Guest poster submits vacancy without account and receives durable receipt (`REF-MDY-...`).
- `[PASS]` Admin authenticates successfully with secure passcode `9999`.
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
# 1. Monorepo clean build
turbo run build

# 2. Run unit test suite (37 tests)
npx tsx scripts/run-tests.js

# 3. Run E2E service scenarios (39 tests)
npx tsx scripts/test-e2e.ts

# 4. Run live HTTP API integration suite (59 tests)
pnpm --filter=@mandya-jobs/api test:http

# 5. Run full Playwright browser matrix (20 tests)
npx tsx scripts/test-browser-acceptance.ts
```
