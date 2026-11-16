# Mandya Jobs — API Specification (/api/v1)

**Standard:** RESTful JSON / OpenAPI 3.0  
**Authentication:** Bearer JWT (Access Token in `Authorization: Bearer <token>`)  

---

## 1. Authentication (`/api/v1/auth`)

- `POST /api/v1/auth/otp/send`  
  Request: `{ "phoneNumber": "9845012345" }`  
  Response: `{ "success": true, "message": "OTP sent successfully", "expiresIn": 300 }`

- `POST /api/v1/auth/otp/verify`  
  Request: `{ "phoneNumber": "9845012345", "otpCode": "123456" }`  
  Response: `{ "token": "jwt...", "refreshToken": "...", "user": { "id": "...", "roles": ["CANDIDATE"] } }`

---

## 2. Candidate Portal (`/api/v1/candidates`)

- `GET /api/v1/candidates/profile` — Fetch candidate profile, education, skills, resumes
- `PUT /api/v1/candidates/profile` — Upsert candidate profile details
- `POST /api/v1/candidates/resumes/upload` — Multipart file upload (PDF/DOCX/TXT)
- `POST /api/v1/candidates/resumes/extract` — Safe text parsing and skill suggestions
- `GET /api/v1/candidates/applications` — List submitted applications with current status timeline
- `POST /api/v1/candidates/applications` — Apply for a job:
  Request: `{ "jobId": "...", "resumeId": "...", "coverNote": "..." }`
- `DELETE /api/v1/candidates/applications/:id` — Candidate withdraws application
- `POST /api/v1/candidates/saved-jobs/:jobId` — Toggle saved bookmark

---

## 3. Public & Job Discovery (`/api/v1/jobs`)

- `GET /api/v1/jobs`  
  Query params: `q`, `category`, `taluk`, `employmentType`, `walkIn`, `salaryMin`, `page`, `limit`, `sort`  
  *Enforcement: Returns only APPROVED & PUBLISHED jobs.*
- `GET /api/v1/jobs/:id` — Public job details with structured SEO metadata
- `GET /api/v1/jobs/:id/match-score` (Candidate Auth)  
  Computes real-time deterministic match score:  
  Response: `{ "score": 92, "reasons": ["Matches billing, tally, customer service"], "missing": ["Advanced Excel"] }`

---

## 4. Employer & Recruiter Portal (`/api/v1/employer`)

- `POST /api/v1/employer/organization` — Register business profile
- `POST /api/v1/employer/verification` — Upload business verification documentation
- `GET /api/v1/employer/jobs` — Organization's jobs across all states
- `POST /api/v1/employer/jobs` — Create / update job draft
- `POST /api/v1/employer/jobs/:id/submit` — Submit job for admin moderation
- `GET /api/v1/employer/jobs/:id/applicants` — View candidate applications
- `PATCH /api/v1/employer/applications/:id/status` — Transition applicant status (Shortlist, Interview, Offer, Reject)
- `POST /api/v1/employer/applications/:id/interviews` — Schedule interview with venue/dates

---

## 5. Trust, Safety & Moderation (`/api/v1/moderation`)
*Requires MODERATOR or SUPER_ADMIN role.*

- `GET /api/v1/moderation/queue?status=SUBMITTED` — Moderation queue
- `GET /api/v1/moderation/jobs/:id` — Inspect job details, version diff, automated fraud flags
- `POST /api/v1/moderation/jobs/:id/action`  
  Request: `{ "action": "APPROVE" | "REJECT" | "REQUEST_CHANGES", "reasonCode": "FEE_PROHIBITED", "notes": "..." }`
- `GET /api/v1/moderation/organizations/queue` — Pending business verifications
- `POST /api/v1/moderation/organizations/:id/verify` — Approve or reject business verification
- `GET /api/v1/moderation/audit-trail` — Immutable log of all administrative actions
