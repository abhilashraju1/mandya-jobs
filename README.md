# Mandya Jobs (ಮಂಡ್ಯ ಜಾಬ್ಸ್) 🌾💼

> **Local opportunities. Verified employers. Relevant careers.**  
> A production-oriented bilingual (Kannada / English) Progressive Web Application (PWA) connecting local job seekers with verified employers in Mandya city and district.

---

## 📌 Architecture Highlights

- **Frontend / PWA:** Next.js (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Serwist Service Worker.
- **Backend API:** NestJS modular monolith, REST `/api/v1`, OpenAPI (Swagger), class-validator, JWT + RBAC guards.
- **Database & Cache:** PostgreSQL 16 with Prisma ORM, Redis 7 with BullMQ.
- **Storage:** Private S3/Cloudflare R2-compatible storage with file quarantine & presigned download URLs.
- **Monorepo:** `pnpm` workspaces + `Turborepo`.

---

## 📁 Repository Structure

```
mandya-jobs/
├── apps/
│   ├── web/                    # Next.js App Router PWA
│   └── api/                    # NestJS REST API Monolith (/api/v1)
│       └── prisma/             # Schema, migrations & deterministic Mandya fixtures
├── packages/
│   ├── types/                  # Shared TypeScript interfaces & enums
│   ├── validation/             # Shared matching engine & DTO validation
│   ├── i18n/                   # Kannada (kn) & English (en) dictionaries
│   ├── ui/                     # Accessible UI components (shadcn-compatible)
│   └── config/                 # Shared TypeScript & linter configs
├── docs/                       # Complete Phase 0 Architecture & Specs
│   ├── PRD.md                  # Detailed Product Requirements Document
│   ├── REFERENCE_AUDIT.md      # UI Screenshots & Live Benchmark Analysis
│   ├── ARCHITECTURE.md         # Monorepo Topology & Deployment Model
│   ├── DATABASE.md             # Complete 26-Entity Prisma Data Model
│   ├── UI_UX_SPEC.md           # Tokens (#2454D6, #0F766E), Typography & Navigation
│   ├── API.md                  # REST /api/v1 API Contracts
│   ├── SECURITY.md             # Threat Model, File Quarantine & DPDP Compliance
│   ├── IMPLEMENTATION_PLAN.md  # 6-Phase Roadmap & Milestones
│   ├── TEST_PLAN.md            # Acceptance Matrix & Deterministic Matching Verification
│   └── references/             # Original PRD and implementation prompts
├── docker-compose.yml          # PostgreSQL, Redis & MinIO services
├── pnpm-workspace.yaml         # Monorepo workspace configuration
└── turbo.json                  # Turborepo task pipeline
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js:** `>= 20.0.0`
- **pnpm:** `>= 9.0.0`
- **Docker & Docker Compose** (for local PostgreSQL, Redis, and MinIO)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/<username>/mandya-jobs.git
cd mandya-jobs
pnpm install
```

### 3. Start Local Infrastructure
```bash
docker compose up -d
```
This starts:
- **PostgreSQL 16** on `localhost:5432`
- **Redis 7** on `localhost:6379`
- **MinIO Storage** on `localhost:9000` (Console on `localhost:9001`)

### 4. Configure Environment
```bash
cp .env.example .env
```

### 5. Run Database Migrations & Seed Data
```bash
pnpm db:migrate
pnpm db:seed
```

### 6. Start the Development Servers
```bash
pnpm dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)
- REST API & Swagger Docs: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

---

## 🎯 Smart Matching Formula (v1 Deterministic)

$$\text{Score} = \text{Skills}(30) + \text{Qualification}(25) + \text{Experience}(20) + \text{Location}(15) + \text{Salary}(10)$$

- **Explainable Reasons:** Matches display exact reasons such as `"Matches: billing, tally, customer service"`.
- **Zero Gating:** Low-score candidates (e.g., 34%) are **never** blocked from applying to any public approved vacancy.

---

## 🛡️ Trust & Safety Guarantees

- **No Candidate Fees:** Explicit platform-wide ban on recruitment fees.
- **Verification Before Publication:** No unverified jobs are ever visible to the public or indexed by search engines.
- **Private Resumes:** Resumes are quarantined, checked by magic-bytes, and strictly protected behind authenticated presigned links.
- **Bilingual First:** 100% Kannada and English interface and notifications.
