# 🌾 Mandya Jobs (ಮಂಡ್ಯ ಜಾಬ್ಸ್) — Complete Project & Cloudflare Guide

> **Production-Oriented PWA | Local Opportunities • Verified Employers • Relevant Careers**  
> Complete documentation covering the project architecture, tech stack, local execution, Cloudflare setup, and sharing access to outside mobile devices via Cloudflare Tunnel.

---

## 📑 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Complete Tech Stack Breakdown](#2-complete-tech-stack-breakdown)
3. [Steps to Run the Project Locally](#3-steps-to-run-the-project-locally)
4. [Cloudflare Local Setup & Configuration](#4-cloudflare-local-setup--configuration)
5. [How to Access on Outside Devices via Cloudflare Tunnel](#5-how-to-access-on-outside-devices-via-cloudflare-tunnel)
6. [Deploying to Cloudflare Production](#6-deploying-to-cloudflare-production)
7. [Security & Anti-Exploitation Policy](#7-security--anti-exploitation-policy)

---

## 1. Project Overview

**Mandya Jobs** is a production-oriented, mobile-first Progressive Web Application (PWA) engineered specifically for the job market in Mandya district, Karnataka.

### 🎯 Key Objectives:
- **Free for Candidates:** Job seekers never pay a single rupee to register, view vacancies, or submit applications.
- **Verified Local Employers:** Employers must verify their business legal entity before vacancy publication. No unverified job ever appears publicly.
- **Bilingual Vernacular (100% Kannada & English):** All screens, buttons, search terms, and notifications operate seamlessly in both Kannada (`kn`) and English (`en`).
- **Explainable Smart Matching:** Replaces opaque algorithms with a transparent 5-factor scoring engine (Skills 30%, Qualification 25%, Experience 20%, Location 15%, Salary 10%).
- **Zero-Gating Rule:** Candidates with lower match scores (e.g. 35%) are **never blocked** from applying to public vacancies.
- **Anti-Fraud Defense:** Built-in heuristic scanners automatically flag any job posting that asks for "registration fees", "training charges", or "deposits".

### 👥 User Personas & Portals:
| Role | Portal / Route | Capabilities |
| :--- | :--- | :--- |
| **Guest** | `/` | Browse verified vacancies, search by taluk, filter walk-ins, view details. |
| **Candidate** | `/login`, `/candidate/profile`, `/candidate/applications`, `/candidate/saved` | Passwordless Phone OTP login, profile editor, resume upload with magic-byte check, application status timeline, withdraw applications. |
| **Employer** | `/employer/post` | 6-step job creation wizard, walk-in interview scheduling, live candidate card preview, applicant management. |
| **Admin / Moderator** | `/admin` | Audit pending employer verifications, review moderation queues, inspect fraud heuristic alerts, reasoned approve/reject with immutable audit logs. |

---

## 2. Complete Tech Stack Breakdown

The application is structured as a high-performance **Turborepo monorepo** managed with **pnpm workspaces**:

```
mandya-jobs/
├── apps/
│   ├── web/                    # Next.js 14 PWA Frontend
│   │   └── wrangler.toml       # Cloudflare Pages & R2 configuration
│   └── api/                    # NestJS Modular Monolith REST API (/api/v1)
│       └── prisma/             # PostgreSQL schema & Mandya seed fixtures
├── packages/
│   ├── types/                  # Shared TypeScript models & enums
│   ├── validation/             # Deterministic matching & fraud detection
│   ├── i18n/                   # Kannada & English translation dictionaries
│   ├── ui/                     # Accessible UI components (shadcn-compatible)
│   └── config/                 # Linter & TypeScript configurations
└── scripts/                    # Automated unit & E2E verification suites
```

### Technology Matrix:
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo Manager** | `pnpm` + `Turborepo` | Cached builds, unified dependency management, multi-package linking. |
| **Web Frontend / PWA** | Next.js 14 (App Router), React 18, TypeScript 5 | Server components, client interactivity, PWA manifest, offline service worker. |
| **Styling & Icons** | Tailwind CSS, Lucide Icons | Responsive mobile design (360px+), custom palette (`#2454D6`, `#0F766E`, `#F5F7FB`). |
| **Backend API** | NestJS 10 (Modular Monolith) | Versioned REST `/api/v1`, OpenAPI (Swagger), dependency injection, RBAC guards. |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM | Relational data integrity across 26 entities, ACID transactions, migrations. |
| **Cache & Queues** | Redis 7 + BullMQ | Phone OTP rate limiting, notifications, automated vacancy expiration. |
| **Cloudflare Hosting** | Cloudflare Pages & Workers | Ultra-low latency edge deployment, SSR runtime with `nodejs_compat`. |
| **Object Storage** | Cloudflare R2 (S3-compatible) | Secure candidate resume storage with signed download URLs. |
| **Edge Tunneling** | Cloudflare Tunnel (`cloudflared`) | Localhost-to-public HTTPS tunnel for testing on real mobile devices. |

---

## 3. Steps to Run the Project Locally

### 3.1 Prerequisites
Ensure the following tools are installed on your machine:
- **Node.js:** `>= 22.0.0` (Recommended: v22.12.0 LTS)
- **pnpm:** `>= 9.0.0`
- **Docker & Docker Compose** (Optional: for local PostgreSQL & Redis)

### 3.2 Installation
```bash
# Clone the repository
git clone https://github.com/abhilashraju1/mandya-jobs.git
cd mandya-jobs

# Install all workspace dependencies
pnpm install
```

### 3.3 Run Automated Test Suites
Run the verified test suites to ensure everything is working:
```bash
# Runs 28 unit tests + 36 end-to-end integration tests (64/64 total)
pnpm run test:all
```

### 3.4 Launch Development Server
```bash
# Start Next.js PWA web app
pnpm dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 4. Cloudflare Local Setup & Configuration

The project is pre-configured with Cloudflare tools for local emulation and seamless cloud deployment.

### 4.1 Configuration File: `apps/web/wrangler.toml`
The configuration binds Cloudflare Pages, the Node.js compatibility layer, and Cloudflare R2 bucket:
```toml
name = "mandya-jobs"
compatibility_date = "2026-11-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

# Cloudflare R2 Storage binding for resumes & logos
[[r2_buckets]]
binding = "MANDYA_STORAGE"
bucket_name = "mandya-jobs-resumes"
preview_bucket_name = "mandya-jobs-resumes-preview"

[vars]
NEXT_PUBLIC_APP_URL = "https://mandya-jobs.pages.dev"
NEXT_PUBLIC_BRAND_NAME = "Mandya Jobs"
NEXT_PUBLIC_BRAND_LOCAL_NAME = "ಮಂಡ್ಯ ಜಾಬ್ಸ್"
NEXT_PUBLIC_DEFAULT_CITY = "Mandya"
NEXT_PUBLIC_DEFAULT_STATE = "Karnataka"
NODE_VERSION = "22"
```

### 4.2 Cloudflare Build Command
To build the application for Cloudflare:
```bash
pnpm run cf:build
```

---

## 5. How to Access on Outside Devices via Cloudflare Tunnel

One of the most powerful features of Cloudflare is **Cloudflare Tunnel (`cloudflared`)**. It allows you to access your local development server from any mobile phone, tablet, or external computer anywhere in the world **without port forwarding, router configuration, or public IP addresses**.

### 5.1 One-Click Quick Tunnel (Zero Setup Required)
Make sure your local dev server is running on `http://localhost:3000`:
```bash
pnpm dev
```

In a second terminal window, run:
```bash
pnpm run tunnel
# OR directly:
cloudflared tunnel --url http://localhost:3000
```

### 5.2 What Happens Next:
`cloudflared` connects securely to Cloudflare's global edge network and outputs an instant, secure public HTTPS URL:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://random-words-subdomain.trycloudflare.com                                          |
+--------------------------------------------------------------------------------------------+
```

### 5.3 How to Test on Your Mobile Phone:
1. Copy the `https://xxxx.trycloudflare.com` URL shown in your terminal.
2. Open it in Chrome or Safari on your mobile phone (connected to mobile data or any Wi-Fi).
3. **Experience the PWA:**
   - Tap your browser's menu (⋮ or Share) and select **"Install App"** or **"Add to Home Screen"**.
   - The app installs as a native mobile PWA with the **Mandya Jobs** icon.
   - Test the Kannada/English language switcher, search filters, and application submission.

---

## 6. Deploying to Cloudflare Production

When you are ready to publish Mandya Jobs live to production, you can choose either of the two official methods:

### Method A: Git Integration via Cloudflare Dashboard (Recommended)
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select your repository: `abhilashraju1/mandya-jobs`.
3. Set the build configuration:
   - **Framework preset:** `Next.js`
   - **Root directory:** `apps/web`
   - **Build command:** `npx @cloudflare/next-on-pages` (or `pnpm run build`)
   - **Build output directory:** `.vercel/output/static`
4. Add Environment Variables in Cloudflare Pages settings:
   - `NODE_VERSION` = `22`
   - `NEXT_PUBLIC_BRAND_NAME` = `Mandya Jobs`
   - `NEXT_PUBLIC_BRAND_LOCAL_NAME` = `ಮಂಡ್ಯ ಜಾಬ್ಸ್`
5. Click **Save and Deploy**. Cloudflare automatically deploys your project to `https://mandya-jobs.pages.dev` with a free SSL certificate and global CDN caching.

### Method B: Deploy via Wrangler CLI
1. Log in to your Cloudflare account in terminal:
   ```bash
   pnpm exec wrangler login
   ```
2. Deploy the static build:
   ```bash
   pnpm run cf:deploy
   ```

### 6.1 Creating the Cloudflare R2 Storage Bucket
For storing candidate resumes privately:
```bash
# Create the production R2 bucket
pnpm exec wrangler r2 bucket create mandya-jobs-resumes

# Create preview bucket for testing
pnpm exec wrangler r2 bucket create mandya-jobs-resumes-preview
```

---

## 7. Security & Anti-Exploitation Policy

Mandya Jobs enforces strict security standards:
- **Zero Candidate Fees:** The platform prohibits any employer from charging interview fees or training deposits.
- **Private Resumes:** Resumes are never exposed in public buckets. Downloads use time-limited presigned URLs (15-minute expiry).
- **Magic-Byte File Inspection:** File uploads are checked by magic bytes (`%PDF`, `PK..`) to prevent malicious executable files.
- **DPDP Act 2023 Compliance:** Transparent consent logs; no collection of Aadhaar numbers by default; support for candidate account deletion.
- **Isolated Tenant Data:** Recruiters from Company A can never view or query candidates applying to Company B.
