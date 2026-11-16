# Mandya Jobs — Reference Audit & Analysis

**Author:** Antigravity Engineering  
**Date:** 16 November 2026  
**Status:** Approved for Implementation  

---

## 1. Audit Summary

This document evaluates the user-provided reference screenshots and external benchmark applications against production requirements for Mandya Jobs.

---

## 2. Source-by-Source Audit Matrix

| Source | Observed Capabilities | Adaptation Decision | Production Changes / Security Hardening |
| :--- | :--- | :--- | :--- |
| **Screenshot 1: Candidate Job Discovery** | - LocalJobs header with "Post a job"<br>- "Your profile" card with skills & resume buttons<br>- Search input + category dropdown<br>- Match cards: Billing Executive (92%), Front Desk Associate (78%), Lab Assistant (34%)<br>- "Matches: billing, tally, customer" explanation<br>- Direct "Apply" CTA button | Adopt layout, match percentage badge, and reason string. | - Compute match scores dynamically (never hardcode).<br>- High contrast WCAG 2.2 AA compliant palette.<br>- Bilingual Kannada/English UI.<br>- Allow low-score candidates to apply without gating. |
| **Screenshot 2: Employer Job Form** | - Business name & Business type (Showroom)<br>- Job title (Billing Executive)<br>- Location & salary (Anna Nagar · 15,000 to 20,000 / month)<br>- Skills needed (billing, tally, customer service)<br>- Description textarea<br>- Contact phone or email (98400 00000)<br>- "Submit for review" button | Adopt structured fields, live preview, and review-before-live workflow. | - Multi-step wizard with autosave.<br>- Separate organization verification from individual job postings.<br>- Add walk-in interview scheduling fields.<br>- Mandya-specific localities (Maddur, Malavalli, etc.). |
| **Screenshot 3: Admin Moderation UI** | - Tab switcher: "Pending 2", "Applications 14", "Profiles 31"<br>- Pending card: Billing Executive (No red flags found) with Approve & Reject<br>- Flagged card: Data Entry Work From Home (Flagged: "registration fee", contact looks invalid)<br>- Latest application preview: Priya R. (92% match) | Adopt fraud alert badges, tabbed queue counts, and moderation CTAs. | - Secure server-side RBAC: absolute restriction on admin routes.<br>- Remove demo reset links and unauthenticated public admin queues.<br>- Structured reason codes and immutable audit logs for all moderation decisions. |
| **Live LocalJobs Reference (`shylendramp.github.io/local-city-jobs`)** | - Public search by title, shop, hospital, school, skill<br>- Walk-in and full-time filters<br>- Resume parser (PDF/DOCX/TXT/paste)<br>- Client-side mock reset | Adopt search dimensions, walk-in filter, and resume extraction idea. | - Replace client-side mock storage with PostgreSQL + Prisma.<br>- Isolate file parsing in backend with MIME/magic-byte checks and quarantine.<br>- True PWA offline fallback without sensitive data caching. |
| **Apna (`apna.co`)** | - Mobile-first job discovery<br>- Low-friction phone OTP registration<br>- Local community trust | Adopt streamlined mobile-first UX and localized messaging. | - Tailored specifically for Mandya district vernacular and employment sectors.<br>- Ban on recruitment fees. |
| **Indeed (`in.indeed.com`)** | - Advanced faceted filters (salary, distance, freshness)<br>- Structured vacancy details & JobPosting schema | Adopt structured salary units and valid schema.org JobPosting for SEO. | - Simple, clutter-free mobile UI adapted for local non-tech users. |
| **Recruitment Dashboards (Dryking / Behance)** | - Recruiter pipeline stages (Shortlisted, Interview, Offer)<br>- Candidate tracking card views | Adopt Kanban and list stages for candidate review. | - Ensure strict organization boundary isolation; no cross-company data leaks. |

---

## 3. Visual Identity Comparison

| Element | Reference Screenshot | Mandya Jobs Production Specification |
| :--- | :--- | :--- |
| **Primary Color** | Generic bright blue (`#1D4ED8`) | Deep Professional Blue (`#2454D6`) |
| **Success Color** | Green (`#16A34A`) | Teal Success (`#0F766E`) |
| **Background** | Pale cream / gray | Crisp Soft Background (`#F5F7FB`) |
| **Card Borders** | Thin outline | Rounded 12–16px cards, subtle elevation, accessible focus rings |
| **Typography** | Standard system sans-serif | High-legibility dual Latin & Kannada typography stack |
| **Language** | English only | 100% Bilingual Kannada & English |
