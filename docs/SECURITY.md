# Mandya Jobs — Security, Privacy & Compliance Architecture

**Version:** 1.0  
**Compliance Standard:** OWASP Top 10, India Digital Personal Data Protection (DPDP) Act 2023  

---

## 1. Threat Model & Mitigation Matrix

| Threat Vector | Risk Description | Mandya Jobs Architecture Control |
| :--- | :--- | :--- |
| **Phone OTP Flooding / SMS Hijacking** | Attackers spam OTP requests to exhaust SMS credits or brute-force codes. | - Strict Redis sliding-window rate limit: max 3 requests per 10 minutes per IP/Phone.<br>- Constant-time hash verification with maximum 5 attempts before invalidation.<br>- OTP valid for 300 seconds (5 minutes).<br>- Development mock provider strictly excluded in production builds. |
| **Malicious File Upload (Resumes)** | Uploading executable binaries disguised as `.pdf` or `.docx`. | - Strict magic-byte inspection (not relying on file extension).<br>- Max file size capped at 5 MB.<br>- Quarantine directory before parsing.<br>- Files stored in private S3/R2 bucket with zero public read permissions.<br>- Access via time-limited presigned URLs (15-minute expiry). |
| **Broken Object Level Authorization (BOLA)** | Recruiter viewing resumes of another company's candidates without consent. | - Server-side NestJS `TenantGuard` and `OwnershipGuard`.<br>- All recruiter queries enforced with `WHERE orgId = req.user.orgId`.<br>- Candidate resumes only accessible if candidate submitted an active application or opted into recruiter discovery. |
| **Fraudulent Job Postings / Fee Scams** | Scammers asking candidates for "security deposit" or "interview fee". | - Strict organizational verification before public visibility.<br>- Automated heuristic scanner flags phrases like "registration fee", "training charge", "telegram/whatsapp only".<br>- Mandatory human moderator approval before any job is published.<br>- Dedicated candidate "Report Scam" button. |
| **Candidate Privacy & DPDP Compliance** | Unauthorized data sharing, tracking without consent. | - No collection of national identity numbers (e.g. Aadhaar) by default.<br>- Explicit consent checkbox recorded with timestamp during onboarding.<br>- Full support for candidate account deletion and resume purging. |
