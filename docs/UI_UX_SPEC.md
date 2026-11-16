# Mandya Jobs — UI/UX Design System & Page Inventory

**Version:** 1.0  
**Design Approach:** Mobile-First, Accessible (WCAG 2.2 AA), PWA-Optimized  

---

## 1. Design Tokens & Palette

| Token | Hex Value | Semantic Usage | WCAG AA Contrast |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#2454D6` | Brand blue, primary buttons, active tabs, links | Compliant on `#FFFFFF` and `#F5F7FB` |
| `--color-primary-hover` | `#1A41AA` | Button active/hover state | High contrast |
| `--color-success` | `#0F766E` | Verification badges, match percentages (70%+), hired status | Compliant on light backgrounds |
| `--color-warning` | `#D97706` | Pending review status, moderate match (40-69%) | Compliant |
| `--color-danger` | `#DC2626` | Reject buttons, fraud alert badges, errors | Compliant |
| `--color-bg-base` | `#F5F7FB` | Main app background canvas | Soft low-fatigue surface |
| `--color-surface` | `#FFFFFF` | Cards, dialogs, sheets, bottom navigation | High contrast |
| `--color-text-main` | `#17243B` | High-contrast body text, headings | 14.8:1 ratio |
| `--color-text-muted` | `#64748B` | Secondary details, metadata, vacancy dates | 4.8:1 ratio |
| `--color-border` | `#E2E8F0` | Dividers, subtle card borders | Crisp borders |

---

## 2. Typography

- **Latin Font Stack:** Inter, system-ui, -apple-system, sans-serif
- **Kannada Font Stack:** Noto Sans Kannada, Tunga, sans-serif
- **Scale:**
  - H1: `28px` / `32px` line-height (Bold)
  - H2: `22px` / `28px` line-height (SemiBold)
  - H3: `18px` / `24px` line-height (Medium)
  - Body: `16px` / `24px` (Ensures readable mobile sizing without auto-zoom)
  - Small / Badge: `13px` / `18px` (Medium)

---

## 3. Navigation Structures

### Candidate Navigation
- **Mobile (Bottom Tab Bar):**
  1. `Home` (Featured, recent, quick categories)
  2. `Search` (Faceted discovery with search bar)
  3. `Saved` (Bookmarked listings)
  4. `Applications` (Active application status timeline)
  5. `Profile` (Resume, experience, skills, language toggle)
- **Desktop:** Sticky top header with Search, Applications, Profile, and quick "Post a Job" switch.

### Employer Navigation
- **Desktop Sidebar / Mobile Drawer:**
  1. `Dashboard` (Key metrics: active jobs, pending applicants, interviews)
  2. `Jobs` (Job listing table, draft wizard, live preview)
  3. `Applicants` (Kanban / filterable list of candidate submissions)
  4. `Interviews` (Upcoming scheduled walk-in & fixed interviews)
  5. `Organization` (Company details, verification evidence, recruiters)

### Admin Navigation
- **Desktop Sidebar / Header:**
  1. `Dashboard` (System overview: pending verifications, flagged posts)
  2. `Approvals` (Job moderation queues: Pending, Changes Requested, Flagged)
  3. `Employers` (Verification queues for business accounts)
  4. `Candidates` (Oversight and complaint investigations)
  5. `Taxonomy` (Skills dictionary, sectors, taluks/localities, CMS)
  6. `Settings` (Audit trail, admin management)

---

## 4. Key UI Components & States

- **Job Card:**  
  12–16px rounded card with employer name, verified tick, title, location, salary badge, walk-in pill, match badge (e.g. `92% match`), and instant `Apply` CTA.
- **Match Reason Chip:**  
  Green/Teal outline chip: `Matches: billing, tally, customer service`
- **Fraud Warning Banner:**  
  Amber/Red border alert on admin and reporting views: `Flagged: "registration fee", contact looks invalid`
- **Application Status Timeline:**  
  Vertical progress tracker showing: `Submitted` → `Viewed` → `Shortlisted` → `Interview Scheduled` → `Offer`.
- **System States Handled:**  
  1. Skeleton Loaders (prevents layout shift)
  2. Empty States (helpful illustrations + "No jobs found, try resetting filters")
  3. Offline Banner ("Working offline. Real-time actions will sync when reconnected.")
  4. Error States with retry button
