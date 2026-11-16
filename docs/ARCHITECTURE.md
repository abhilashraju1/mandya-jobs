# Mandya Jobs — Technical Architecture & Monorepo Design

**Status:** Approved  
**Version:** 1.0  

---

## 1. System Topology Overview

Mandya Jobs is engineered as a high-performance, modular monorepo managed via `pnpm` workspaces and `Turborepo`.

```
                    ┌───────────────────────────────────┐
                    │          Client Browser           │
                    │   (PWA: Desktop / Mobile / Tab)   │
                    └─────────────────┬─────────────────┘
                                      │ HTTPS / WSS
                                      ▼
                    ┌───────────────────────────────────┐
                    │        Next.js App Router         │
                    │            (apps/web)             │
                    │  - React Server Components        │
                    │  - PWA Service Worker & Manifest  │
                    │  - Client-side State & Cache      │
                    └─────────────────┬─────────────────┘
                                      │ REST API (/api/v1)
                                      ▼
                    ┌───────────────────────────────────┐
                    │          NestJS API Gate          │
                    │            (apps/api)             │
                    │  - Modular REST Controllers       │
                    │  - JWT & RBAC Guards              │
                    │  - OpenAPI (Swagger) Contracts    │
                    │  - Resume Magic-Byte / Quarantine │
                    └──────┬──────────┬──────────┬──────┘
                           │          │          │
         ┌─────────────────┘          │          └─────────────────┐
         ▼                            ▼                            ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│   PostgreSQL    │          │      Redis      │          │ Cloudflare R2 / │
│   (Prisma ORM)  │          │    (BullMQ)     │          │   S3 Storage    │
│  - 26 Entities  │          │  - Expiry Jobs  │          │  - Resumes      │
│  - Tracing & DB │          │  - Notifications│          │  - Brand Logos  │
│    Transactions │          │  - Throttling   │          │  - Quarantined  │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

---

## 2. Monorepo Structure

```
mandya-jobs/
├── apps/
│   ├── web/                    # Next.js App Router (PWA Frontend)
│   │   ├── app/                # App Router routes (public, candidate, employer, admin)
│   │   ├── components/         # Reusable feature & UI components
│   │   ├── hooks/              # Custom React hooks (auth, matching, i18n, offline)
│   │   ├── lib/                # API client, service worker registration, utils
│   │   ├── public/             # Icons, manifest.json, sw.js, offline.html
│   │   └── tailwind.config.ts  # Tailwind CSS configuration with design tokens
│   │
│   └── api/                    # NestJS Modular Monolith Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/       # Phone OTP, session management, guards
│       │   │   ├── candidates/ # Candidate profile, experience, education
│       │   │   ├── resumes/    # Safe file validation, parsing, storage
│       │   │   ├── employers/  # Organization profiles & verification
│       │   │   ├── jobs/       # Job CRUD, wizard, versioning, state machine
│       │   │   ├── matching/   # Deterministic explainable scoring engine
│       │   │   ├── applications/# Application pipeline, timeline, history
│       │   │   ├── moderation/ # Admin approval queue, fraud heuristics, audit
│       │   │   ├── taxonomy/   # Categories, skills, locations, translations
│       │   │   └── notifications/# BullMQ queue, email/SMS/in-app handlers
│       │   ├── common/         # Filters, interceptors, decorators, pipes
│       │   └── prisma/         # Prisma client service
│       └── prisma/
│           ├── schema.prisma   # PostgreSQL relational data schema
│           ├── migrations/     # Prisma migration history
│           └── seed.ts         # Deterministic Mandya demo seed fixtures
│
├── packages/
│   ├── types/                  # Shared TypeScript interfaces & DTO definitions
│   ├── validation/             # Shared Zod / class-validator schemas
│   ├── i18n/                   # Kannada & English dictionaries & translation keys
│   ├── ui/                     # Shared UI primitives (shadcn-compatible)
│   └── config/                 # Shared ESLint, Prettier, and TSConfig rules
│
├── docs/                       # Architecture, PRD, API specs, diagrams
├── docker-compose.yml          # PostgreSQL, Redis, MinIO local environment
├── pnpm-workspace.yaml         # Monorepo workspace configuration
└── turbo.json                  # Turborepo task pipeline definitions
```

---

## 3. Core Architectural Principles

1. **Strict Tenant & Role Isolation:**  
   Every API endpoint mutating data enforces user authentication and role verification. Recruiter queries are strictly scoped by `organizationId`. Admin moderation routes are blocked by `RolesGuard([Role.MODERATOR, Role.SUPER_ADMIN])`.

2. **Bilingual by Design:**  
   Strings and UI labels are stored in dictionary files (`packages/i18n`). Taxonomy entities (categories, skills, locations) support both English names and Kannada display names.

3. **Deterministic Explainable Matching:**  
   No black-box algorithms. Matching logic is pure TypeScript within `packages/validation` or `apps/api/src/modules/matching`, enabling instant unit test coverage and clear user explanations.

4. **Security & Content Integrity:**  
   Resumes are inspected using magic numbers (not just file extensions). Dangerous binaries are rejected. Uploaded resumes reside in private buckets with time-limited presigned URLs.
