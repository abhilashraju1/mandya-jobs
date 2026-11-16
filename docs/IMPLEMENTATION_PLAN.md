# Mandya Jobs — Phased Implementation Roadmap

**Status:** Phase 0 Completed / Phase 1 In-Progress  
**Architecture:** pnpm + Turborepo Monorepo (Next.js PWA + NestJS Modular Monolith + PostgreSQL)  

---

## Roadmap Overview

```
Phase 0: Discovery & Specs ──► Phase 1: Foundation & Auth ──► Phase 2: Candidate Experience
                                                                        │
Phase 5: PWA, Seed & Launch ◄── Phase 4: Matching & Pipeline ◄── Phase 3: Employer & Moderation
```

---

## Detailed Phases and Exit Criteria

### Phase 0: Discovery, Architecture & Design System (Completed)
- [x] Comprehensive review of PRD & reference screenshots (Candidate 92/78/34 match UI, Employer job form, Admin review queue).
- [x] Reference audit (`docs/REFERENCE_AUDIT.md`) comparing benchmarks with production rules.
- [x] Architecture specification (`docs/ARCHITECTURE.md`) with monorepo topology.
- [x] Database specification & full Prisma schema (`docs/DATABASE.md`).
- [x] UI/UX Design System & Tokens (`docs/UI_UX_SPEC.md`).
- [x] Security & DPDP Compliance Plan (`docs/SECURITY.md`).
- [x] API Contracts (`docs/API.md`).

---

### Phase 1: Foundation, Infrastructure & Core Auth
- [ ] Monorepo workspace setup (`apps/web`, `apps/api`, `packages/types`, `packages/validation`, `packages/i18n`, `packages/ui`).
- [ ] Docker Compose orchestration for local PostgreSQL 16, Redis 7, MinIO.
- [ ] Prisma migration setup and base taxonomy seeding.
- [ ] Phone OTP authentication system with rate limiting and mock provider for development.
- [ ] Role-Based Access Control (RBAC) guards (`CANDIDATE`, `EMPLOYER_OWNER`, `EMPLOYER_RECRUITER`, `MODERATOR`, `SUPER_ADMIN`).
- [ ] Bilingual i18n setup supporting Kannada (`kn`) and English (`en`).
- **Exit Gate:** Verified Docker spin-up, Prisma migrations run clean, OTP test endpoints issue signed JWTs with correct roles.

---

### Phase 2: Candidate Portal & Resume Engine
- [ ] Mobile-first bottom navigation (Home, Search, Saved, Applications, Profile).
- [ ] Candidate profile builder: education, work experience, skills tagging.
- [ ] Secure resume manager: PDF/DOCX/TXT upload, magic-byte inspection, safe text extraction into reviewable form.
- [ ] Candidate job discovery feed with search bar, category chips, and multi-faceted filters (salary, employment type, walk-in, taluk).
- [ ] Rich job details view with verified employer badge, walk-in schedules, and dynamic match badge.
- [ ] Saved jobs bookmarking.
- **Exit Gate:** Candidate can register, fill profile, upload resume, search jobs in Kannada/English, and save vacancies.

---

### Phase 3: Employer Portal & Admin Moderation
- [ ] Organization onboarding & verification document upload.
- [ ] 6-Step Job Posting Wizard with autosave, walk-in interview scheduling, and salary period selector.
- [ ] Live preview component (exact WYSIWYG candidate card rendering).
- [ ] Job state machine: `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` / `CHANGES_REQUESTED`.
- [ ] Admin moderation dashboard:
  - Tabbed queues: Pending, Changes Requested, Flagged.
  - Automated fraud detection heuristics (highlighting "registration fee", suspicious terms).
  - Reasoned approval/rejection with immutable audit logs.
- **Exit Gate:** Employer creates and previews job; job is held in review queue; admin approves or flags; approved job instantly becomes visible in public search.

---

### Phase 4: Smart Matching, Applications & Recruitment Pipeline
- [ ] Deterministic explainable matching engine (Skills 30%, Qualification 25%, Experience 20%, Location 15%, Salary 10%).
- [ ] Kannada and English skill normalization and synonym dictionary.
- [ ] Application submission modal with resume snapshot and cover note (unrestricted for any match score).
- [ ] Duplicate application prevention and withdrawal workflow.
- [ ] Recruiter applicant review pipeline (Kanban / list: New, Shortlisted, Interview Scheduled, Offered, Hired, Rejected).
- [ ] Interview scheduling tool with candidate notifications.
- **Exit Gate:** Test fixtures verify 92%, 78%, and 34% match explanations; recruiter can shortlist and schedule interviews; candidate sees updated status timeline.

---

### Phase 5: PWA, Demo Seed Dataset & Staging Readiness
- [ ] Web App Manifest (`manifest.json`) and service worker for PWA installation.
- [ ] Offline fallback view with network status listener.
- [ ] Realistic Mandya seed dataset (12–15 employers, 30–50 jobs across showrooms, clinics, hotels, CA offices, plus 1 intentional flagged test scam).
- [ ] Complete E2E integration and unit test coverage.
- [ ] Staging and production deployment guides.
- **Exit Gate:** PWA installs cleanly on mobile/desktop, offline indicator works, all test suites pass with real evidence.
