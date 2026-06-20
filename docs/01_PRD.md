# CivicAI — Product Requirements Document (PRD)

**Project Name:** CivicAI — AI-Powered Accessible Public Participation Portal  
**Version:** 1.1  
**Course:** INTE 324 Team Project | Group 2 | Kabarak University  
**Date:** June 2026  
**Team:** Jack Mula, Simon Njoroge Wangui, Shelton Mumo, Carson Ombane

> **v1.1 changelog:** Section 5 (Scope) revised to match the approved Team Project Topic Approval Template. Native mobile app and government analytics dashboard moved from a vague "Phase 2+" bucket to permanently out of scope, since neither appears in the approved proposal and both add complexity the project doesn't need. SMS / M-Pesa notifications removed entirely — it was never part of the approved scope or the presentation report's listed enhancements, and appears to have been scope creep in v1.0. Remaining future items are now grouped under "Pre-Release Enhancements" to distinguish a realistic post-MVP target from features that were never actually planned.

---

## 1. Product Overview

CivicAI is a web-based platform that makes Kenyan government policy documents accessible to all citizens, regardless of literacy level, disability, or internet bandwidth. Using AI, the platform converts complex legal/policy PDFs into simplified summaries and audio narrations, and enables citizens to submit feedback digitally.

### 1.1 Vision

> "Every Kenyan citizen — literate or not, sighted or not, urban or rural — can understand and respond to government policies."

### 1.2 Mission

To remove barriers to public participation in Kenya by combining AI summarization, text-to-speech, and accessible design into a single civic platform.

---

## 2. Problem Statement

Public participation is a constitutional requirement in Kenya (Article 118, Constitution of Kenya 2010), yet most citizens are excluded due to:

| Barrier | Affected Population |
|---|---|
| Complex legal English in policy PDFs | Low-literacy populations, rural communities |
| No audio/visual alternatives | Visually impaired, blind citizens |
| No sign language support | Deaf citizens |
| Desktop-only platforms | Mobile-first rural users |
| No simplified summaries | General public, students |

Existing platforms (Huduma, eCitizen) do not address these accessibility gaps.

---

## 3. Goals & Success Metrics

### 3.1 Goals

- Simplify government policy documents using AI
- Provide audio narration for every uploaded document
- Enable citizen feedback submission
- Be fully accessible (WCAG 2.1 AA compliant)
- Work on low-bandwidth / mobile networks

### 3.2 Key Performance Indicators (MVP)

| Metric | Target (3 months post-launch) |
|---|---|
| Documents uploaded | 50+ |
| Active users | 500+ |
| Feedback submissions | 200+ |
| Avg. summary accuracy (human eval) | ≥ 85% |
| Page load time (3G) | < 4 seconds |
| Mobile usability score | ≥ 90/100 |

---

## 4. Target Users

### 4.1 Primary Users

1. **Persons with Visual Impairments** — require screen-reader support and audio narration
2. **Low-Literacy / Rural Citizens** — require simplified language summaries
3. **Deaf Citizens** — require visual-first content (future: sign language)
4. **General Public** — citizens who want to understand policies quickly

### 4.2 Secondary Users

5. **Civil Society Organizations (CSOs)** — need to analyze and share policies
6. **Students & Researchers** — need accessible policy data
7. **Government Institutions** — upload documents and review feedback

### 4.3 User Personas

**Persona A — Wanjiku, 45, Murang'a County**
- Primary school education, Kikuyu speaker
- Accesses internet via feature phone / cheap Android
- Needs: simplified Swahili/English summary, audio narration

**Persona B — David, 28, Nairobi, visually impaired**
- University-educated, uses screen reader (NVDA)
- Needs: ARIA-compliant interface, audio playback, skip navigation

**Persona C — CSO Policy Analyst, Nairobi**
- Downloads and shares policy documents
- Needs: fast summary, shareable links, feedback dashboard

---

## 5. Scope

### 5.1 In Scope (MVP)

This list matches the four "Main Features" in the approved Team Project Topic Approval Template, broken into their implementation pieces:

- User registration & login (email + Google OAuth)
- Policy document upload (PDF, DOCX)
- AI-generated plain-English summary
- Text-to-speech audio narration
- Accessible document viewer
- Citizen feedback form (per policy)
- Admin dashboard (upload + view feedback)
- Mobile-responsive UI (responsive web, not a native app — see 5.3 below)

### 5.2 Pre-Release Enhancements (post-MVP, in scope for the project's roadmap)

These are realistic next steps once the MVP is working, and match the "Future Enhancements" named in the project's presentation report. None of these are required for the MVP submission/demo:

- Local language translations (Swahili, Kikuyu, Luo, etc.)
- Sign language video generation
- AI question-answering chatbot per document

### 5.3 Out of Scope (permanently — not planned for any phase)

These were removed to keep the project scoped to what a 4-person team can realistically build and demo for a course project, and because none of them appear in the approved proposal:

- **Native mobile app (iOS/Android)** — the responsive web UI already covers the mobile-first usage pattern described in the personas; a separate native app would duplicate that work for no MVP benefit.
- **Analytics dashboard for government** — out of scope because it serves a user (government institutions analyzing aggregate engagement) that isn't part of the MVP's core accessibility mission, and significantly expands the data model and admin UI for a feature with no graded deliverable tied to it.
- **SMS notifications (M-Pesa / Safaricom integration)** — removed entirely. This was never part of the approved proposal or the presentation report's feature list, and pulling in Safaricom Daraja or M-Pesa integration for a course MVP adds real-world payment/telecom complexity disproportionate to its value here.

---

## 6. Functional Requirements

### 6.1 Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Users can register with email & password | Must Have |
| FR-02 | Users can log in with Google OAuth | Must Have |
| FR-03 | Admins have a separate login and elevated permissions | Must Have |
| FR-04 | Passwords are hashed using bcrypt | Must Have |
| FR-05 | JWT tokens used for session management | Must Have |

### 6.2 Document Management

| ID | Requirement | Priority |
|---|---|---|
| FR-06 | Admins can upload PDF and DOCX policy documents | Must Have |
| FR-07 | System stores document metadata (title, date, category, ministry) | Must Have |
| FR-08 | Documents are listed on a searchable public index | Must Have |
| FR-09 | Users can filter documents by category/ministry/date | Should Have |
| FR-10 | Documents are downloadable as original PDF | Should Have |

### 6.3 AI Processing

| ID | Requirement | Priority |
|---|---|---|
| FR-11 | System auto-generates plain-English summary on upload | Must Have |
| FR-12 | Summary is stored and displayed alongside document | Must Have |
| FR-13 | System generates audio narration from the summary | Must Have |
| FR-14 | Audio is playable inline and downloadable as MP3 | Must Have |
| FR-15 | AI processing runs asynchronously (non-blocking upload) | Must Have |
| FR-16 | Processing status shown to admin (pending/done/failed) | Should Have |

### 6.4 Accessibility

| ID | Requirement | Priority |
|---|---|---|
| FR-17 | All pages are screen-reader compatible (ARIA labels) | Must Have |
| FR-18 | Skip-to-content navigation link on all pages | Must Have |
| FR-19 | Font size adjustable by user | Should Have |
| FR-20 | High-contrast mode toggle | Should Have |
| FR-21 | Audio player has keyboard controls | Must Have |

### 6.5 Citizen Feedback

| ID | Requirement | Priority |
|---|---|---|
| FR-22 | Citizens can submit text feedback on any policy | Must Have |
| FR-23 | Feedback requires login | Must Have |
| FR-24 | Admins can view all feedback per document | Must Have |
| FR-25 | Feedback can be marked as reviewed by admin | Should Have |

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Page load time | < 3s on 4G, < 6s on 3G |
| NFR-02 | System uptime | 99.5% |
| NFR-03 | AI summary generation time | < 30 seconds per document |
| NFR-04 | Audio generation time | < 60 seconds per document |
| NFR-05 | Concurrent users (MVP) | 100 simultaneous |
| NFR-06 | WCAG compliance | Level AA |
| NFR-07 | Mobile support | Android 8+, iOS 13+ browsers |
| NFR-08 | Data encryption at rest and in transit | AES-256 / TLS 1.3 |

---

## 8. User Stories

```
US-01: As a citizen, I want to read a simplified summary of a policy so I can understand it quickly.
US-02: As a visually impaired user, I want to listen to an audio narration so I can access the content without reading.
US-03: As a citizen, I want to submit my feedback on a policy so my voice is heard.
US-04: As an admin, I want to upload a policy document so citizens can access it.
US-05: As an admin, I want to view citizen feedback so I can report it to the government.
US-06: As a citizen, I want to search for policies by keyword so I can find what I need quickly.
US-07: As a screen reader user, I want the site to be fully navigable by keyboard so I am not excluded.
```

---

## 9. Constraints & Assumptions

- OpenAI API costs will be managed by request batching and caching summaries
- Supabase free tier used for MVP; scale to paid on launch
- Team has access to Vercel hobby tier for deployment
- Internet connectivity in target areas may be 2G/3G — audio files should be compressed
- No budget for third-party accessibility audits at MVP stage

---

## 10. Milestones

| Phase | Deliverable | Timeline |
|---|---|---|
| Phase 0 | Documentation & Architecture | Week 1-2 |
| Phase 1 | Auth + Document Upload (admin) | Week 3-4 |
| Phase 2 | AI Summary + Audio Pipeline | Week 5-6 |
| Phase 3 | Public-facing UI + Accessibility | Week 7-8 |
| Phase 4 | Feedback System + Admin Dashboard | Week 9-10 |
| Phase 5 | Testing, Bug Fix, Deployment | Week 11-12 |
