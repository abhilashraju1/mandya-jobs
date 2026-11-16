# Mandya Jobs — Comprehensive Test Strategy & Acceptance Matrix

**Version:** 1.0  
**Test Frameworks:** Vitest / Jest (Unit & Integration), Playwright (E2E), Axe-core (Accessibility)  

---

## 1. Test Layers & Scope

```
                ┌──────────────────────────────┐
                │   Playwright E2E Scenarios   │  (Full user journeys across roles)
                ├──────────────────────────────┤
                │   API Integration Tests      │  (Prisma DB, RBAC, File Uploads)
                ├──────────────────────────────┤
                │   Unit & Logic Tests         │  (Matching Engine, State Machines)
                └──────────────────────────────┘
```

---

## 2. Deterministic Matching Engine Verification

The matching engine calculates score deterministically:
$$\text{Score} = \text{Skills}(30) + \text{Qualification}(25) + \text{Experience}(20) + \text{Location}(15) + \text{Salary}(10)$$

### Reference Benchmark Fixtures:
1. **Scenario A (Target 92% Match):**
   - Job: Billing Executive at Sri Lakshmi Showroom (Mandya Town). Requires Tally, Billing, Customer Service.
   - Candidate: Has Tally, Billing, Customer Service skills; matches location; matches salary expectations; has 2 years showroom experience.
   - Result: 92% match with explanation `"Matches: billing, tally, customer service"`.
2. **Scenario B (Target 78% Match):**
   - Job: Front Desk Associate at Green Leaf Hotel. Requires English communication, Customer Service, Hotel Desk software.
   - Candidate: Has Customer Service, Basic English; matches location; lacks desk software.
   - Result: 78% match with explanation `"Matches: customer service, english"`.
3. **Scenario C (Target 34% Match):**
   - Job: Lab Assistant at City Hospital / College. Requires DMLT, Pathology lab skills.
   - Candidate: Has general billing and customer service skills only.
   - Result: 34% match with missing requirement badges.
   - **Crucial Acceptance Test:** The "Apply" button remains clickable and active. System does NOT block candidate from applying.

---

## 3. End-to-End Test Matrix

| ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **E2E-01** | Candidate Onboarding & Resume Upload | Candidate registers via Phone OTP, uploads PDF resume, verifies extracted skills, and sees completed profile. |
| **E2E-02** | Employer Job Creation & Live Preview | Employer creates job wizard draft with walk-in interview dates, inspects live preview, and submits for moderation. |
| **E2E-03** | Admin Fraud Detection & Approval | Moderator dashboard displays flagged scam listing with "registration fee" alert; moderator inspects and rejects with reason code. |
| **E2E-04** | Candidate Discovery & Application | Candidate searches "Billing Executive", filters by "Mandya Town", views job details, applies with resume snapshot, and tracks status. |
| **E2E-05** | Recruiter Shortlist & Interview | Recruiter views candidate submission, moves status to "Shortlisted", schedules walk-in interview; candidate receives update. |
| **E2E-06** | Bilingual Language Switching | User switches language toggle; all navigation, search chips, form labels, and errors switch instantly between Kannada and English. |
| **E2E-07** | PWA Installation & Offline Fallback | Browser fires `beforeinstallprompt`; service worker caches assets; disconnecting internet displays accessible offline fallback banner. |
| **E2E-08** | Security & Tenant Isolation | Recruiter from Company A attempts to access applicant of Company B via URL manipulation; API returns `403 Forbidden`. |
