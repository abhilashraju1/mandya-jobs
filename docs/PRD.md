# Mandya Jobs — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 16 November 2026  
**Scope:** Responsive Installable Progressive Web Application (PWA Only)  
**Markets:** Mandya City & District / Taluks (Maddur, Malavalli, Pandavapura, Nagamangala, Krishnarajpet, Srirangapatna)  
**Languages:** Kannada (kn) & English (en)  
**Primary Users:** Candidate, Employer Owner, Recruiter, Moderator, Super Admin, Guest  

---

## 1. Executive Summary

Mandya Jobs is a production-oriented bilingual Progressive Web Application connecting local job seekers with verified employers across Mandya city and surrounding taluks. Sectors covered include hotels/restaurants, hospitals/clinics, schools/colleges, retail showrooms, CA/auditor offices, legal offices, agriculture/dairy, manufacturing, transport/driving, logistics, IT, and local services.

### Core Value Propositions
- **For Candidates:** 100% free applications, transparent match explanations (e.g., "Tally skill matched"), local walk-in discovery, Kannada/English interface, no hidden recruitment fees.
- **For Employers:** Verified badges, structured job wizard with walk-in interview scheduling, applicant management, team collaboration without cross-organization leakage.
- **For Administrators & Trust:** Two-tier verification (organization verification and vacancy moderation), automated fraud heuristics (e.g. flagging "registration fee" phrases), immutable audit logging.

---

## 2. Personas and Role-Based Access Control (RBAC)

| Role | Description & Permissions |
| :--- | :--- |
| **Guest** | Unauthenticated user. Can browse approved live jobs, search, filter, view public details, switch languages, view public CMS/FAQ. Prompted to register when applying or saving jobs. |
| **Candidate** | Job seeker. Manages profile, education, experience, skills, resumes (PDF/DOCX/TXT/pasted), applications, interview schedules, saved jobs, notifications, and privacy preferences. |
| **Employer Owner** | Organization administrator. Creates business profile, uploads verification documents, invites recruiters, posts jobs, manages recruitment pipeline, views applicant resumes upon consent. |
| **Employer Recruiter** | Organization team member. Manages jobs and applicants assigned within their organization. Strictly barred from accessing other organizations. |
| **Moderator** | Trust & safety officer. Reviews organization verification submissions, audits pending/flagged jobs, approves/rejects with standardized reason codes, requests edits. |
| **Super Admin** | Platform owner. System-wide configuration, manages taxonomy (categories, skills, locations), manages moderators, oversees audit trails and analytics. |

---

## 3. Candidate Experience

### 3.1 Onboarding & Authentication
- Passwordless Phone OTP authentication with secure provider adapter (mock in dev, Twilio/MSG91 in prod).
- Optional email link for notifications.
- Terms of service and privacy consent before profile creation.
- Initial language selection (Kannada or English) and locality selection (Mandya city or taluk).

### 3.2 Profile & Resume Management
- Personal details: Full name, phone, email, locality/taluk, fresher status, expected salary, availability.
- Education & qualifications: Degree, institution, year, specialization.
- Work history: Organization, role, tenure, responsibilities.
- Skills: Tagged skills linked to canonical taxonomy with Kannada/English synonyms.
- Resume manager:
  - Upload PDF/DOCX (magic-byte check, virus quarantine, max 5MB).
  - Optional paste text / plain text resume.
  - Safe parsing extracts candidate details into reviewable draft fields before saving.
  - Downloadable platform-generated standard resume.

### 3.3 Discovery, Search & Filters
- Keyword search across job titles, business names, skills, and areas.
- Multi-faceted filters:
  - Employment type: Full-time, Part-time, Walk-in, Internship, Contract.
  - Category / Sector (Showrooms, Healthcare, Education, Hospitality, etc.).
  - Salary range and payment cycle (monthly, daily, hourly).
  - Experience level (Fresher, 1-2 years, 3-5 years, 5+ years).
  - Taluk / Locality.
- Sorting: Best match, Newest first, Highest salary.

### 3.4 Job Details & Application Workflow
- Rich structured details: Verified organization badge, vacancy count, working hours, benefits, walk-in interview dates/times/venue, expiry date.
- Match explanation badge (e.g., 92% match: "Matches billing, tally, customer service").
- **Crucial Rule:** Candidates may apply to any approved job irrespective of match score, provided explicit legal eligibility is met. Match score never disables the "Apply" CTA.
- Application modal: Select resume version, add optional cover note, preview details, confirm submission.
- Prevent duplicate active applications.
- Tracking status: Submitted → Under Review → Shortlisted → Interview Scheduled → Offered → Hired (or Rejected / Withdrawn).

---

## 4. Employer & Recruiter Portal

### 4.1 Organization Profile & Verification
- Business legal name, trade/display name, category, logo, address, contact persons, GST/trade license details.
- Verification status independent of individual jobs: `PENDING`, `VERIFIED`, `REJECTED`, `CHANGES_REQUESTED`.

### 4.2 Job Creation Wizard
- Step 1: Basic info (title, category, employment type, vacancies).
- Step 2: Location & compensation (locality, address, salary min/max, negotiable toggle, pay period).
- Step 3: Requirements (experience, education, required skills, preferred skills).
- Step 4: Walk-in schedule (dates, start/end time, venue address, instructions).
- Step 5: Description & benefits (perks, working hours, contact preferences).
- Step 6: Live preview (rendered exactly as candidates will see it) and "Submit for review".

### 4.3 Recruitment & Pipeline
- Kanban / tabular pipeline: New Applications, Shortlisted, Interview Scheduled, Offered, Hired, Rejected.
- Resume viewer with authorized access.
- Interview scheduler: Date, time, venue / phone details, notes sent directly to candidate.
- Reasoned rejection (e.g. "Position filled", "Missing prerequisite qualification").

---

## 5. Trust, Safety & Moderation

### 5.1 Vacancy Moderation Lifecycle
`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` / `CHANGES_REQUESTED` → `PUBLISHED` → `CLOSED` / `EXPIRED` / `ARCHIVED`.
- Only `PUBLISHED` jobs are queryable by candidates and public guests.
- Material edits to published jobs create a draft version for re-approval while keeping the live version unchanged.

### 5.2 Fraud Detection Heuristics
- Automated flag rules:
  - Registration fee / deposit phrases (e.g. "pay registration fee", "security deposit required").
  - Suspicious work-from-home offers with unrealistic wages.
  - Invalid phone numbers or blacklisted contacts.
  - Repeated duplicate ad spam.
- Flagged posts require human moderator decision; no blind automatic deletion.

### 5.3 Anti-Exploitation Policy
- Zero tolerance for candidate recruitment fees.
- In-app reporting for candidates ("Report this listing") with escalation workflow.

---

## 6. Smart Matching Engine (v1 Deterministic)

The matching algorithm is transparent, explainable, and computed on-the-fly (no hardcoded scores):
- **Skills Match (30% weight):** Intersection of candidate skills and required/preferred job skills, normalized across Kannada/English aliases.
- **Qualification Match (25% weight):** Education level alignment (e.g., PUC, Graduate, Diploma).
- **Experience Match (20% weight):** Years of relevant experience vs job min experience.
- **Location Match (15% weight):** Locality/Taluk match score.
- **Salary / Preferences Match (10% weight):** Expected vs offered salary alignment.

---

## 7. PWA, Localization & Offline Capabilities

- Web App Manifest (`manifest.json`) with Mandya Jobs branding and icons.
- Service worker for static asset caching, offline fallback page, and background sync when connection restores.
- Strict security: Never cache private resumes, session tokens, or admin screens in offline caches.
- Complete localization for Kannada (`kn`) and English (`en`) with instant language toggle.
