# CivicAI — System Architecture Document

**Version:** 1.0  
**Date:** June 2026

---

## 1. Architecture Overview

CivicAI uses a **monolithic Next.js architecture** deployed on Vercel, with Supabase as the Backend-as-a-Service (BaaS) layer. This approach minimizes infrastructure complexity while allowing the team to iterate quickly for MVP.

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS (Browser)                         │
│              Citizens │ Admins │ CSOs │ Researchers              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                         │
│                  CDN │ Edge Middleware │ WAF                      │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│  Next.js Frontend (SSR)  │    │   Next.js API Routes (Backend)  │
│  • React Components      │    │   • /api/policies               │
│  • App Router Pages      │    │   • /api/process/summarize      │
│  • Tailwind CSS UI       │    │   • /api/process/tts            │
│  • Audio Player          │    │   • /api/feedback               │
│  • Accessible Viewer     │    │   • /api/upload                 │
└──────────────────────────┘    └────────────┬────────────────────┘
                                             │
              ┌──────────────────────────────┤
              │                              │
              ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│   SUPABASE (BaaS)        │    │       EXTERNAL AI SERVICES       │
│   ┌───────────────────┐ │    │   ┌─────────────────────────┐   │
│   │  PostgreSQL DB     │ │    │   │  OpenAI API (GPT-4o)    │   │
│   │  • policies        │ │    │   │  • Document summarize   │   │
│   │  • users           │ │    │   └─────────────────────────┘   │
│   │  • feedback        │ │    │   ┌─────────────────────────┐   │
│   │  • processing_jobs │ │    │   │  Google Cloud TTS       │   │
│   └───────────────────┘ │    │   │  • Audio generation     │   │
│   ┌───────────────────┐ │    │   └─────────────────────────┘   │
│   │  Supabase Auth     │ │    └─────────────────────────────────┘
│   │  • JWT sessions    │ │
│   │  • Google OAuth    │ │
│   └───────────────────┘ │
│   ┌───────────────────┐ │
│   │  Supabase Storage  │ │
│   │  • PDF/DOCX files  │ │
│   │  • MP3 audio files │ │
│   └───────────────────┘ │
└─────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend Layer (Next.js App Router)

Responsible for all user-facing UI. Server-side renders policy pages for SEO and performance. Uses React Server Components where data-fetching is needed.

| Component | Responsibility |
|---|---|
| Public Pages | Policy listing, policy detail, search |
| Auth Pages | Login, register |
| Admin Pages | Upload, feedback review, processing status |
| Layout | Navbar, footer, skip nav, accessibility toolbar |
| Audio Player | Inline MP3 playback with keyboard controls |

### 2.2 API Layer (Next.js API Routes)

All business logic lives in `/app/api/`. Protects routes via `middleware.ts` which checks Supabase JWT before reaching admin endpoints.

### 2.3 AI Processing Pipeline

Triggered asynchronously after document upload:

```
1. File upload → Supabase Storage → URL returned
2. Background job → extract text (pdf-parse / mammoth)
3. Text chunked → OpenAI API → plain-English summary
4. Summary → Google TTS → MP3 audio
5. URLs + summary → saved to PostgreSQL
6. Status updated → "ready"
```

### 2.4 Supabase (Data + Auth + Storage)

- **Auth:** Handles registration, login, Google OAuth, JWT issuance
- **PostgreSQL:** Primary data store for all entities
- **Storage:** Buckets for policy files and audio files
- **Row Level Security (RLS):** Enforces data access control at DB level

---

## 3. Data Flow Diagrams

### 3.1 Document Upload Flow (Admin)

```
Admin → Upload Form
     → POST /api/upload (file)
     → Supabase Storage (PDF saved)
     → POST /api/policies (metadata)
     → Insert policy row (status: "processing")
     → Trigger /api/process/summarize
          → Extract text from file
          → Send to OpenAI
          → Receive summary
          → Trigger /api/process/tts
               → Send summary to Google TTS
               → Save MP3 to Supabase Storage
          → Update policy row (status: "ready", summary, audio_url)
     → Admin sees "Ready" status in dashboard
```

### 3.2 Citizen Access Flow

```
Citizen → /policies (public page)
       → GET /api/policies (list, SSR)
       → Clicks policy → /policies/:id
       → GET /api/policies/:id (detail + summary + audio URL)
       → Page renders: summary text + audio player
       → Citizen listens to audio (streamed from Supabase CDN)
       → Citizen submits feedback
       → POST /api/policies/:id/feedback (requires auth)
       → Feedback saved to DB
```

---

## 4. Deployment Architecture

```
GitHub (main branch)
       │ push
       ▼
Vercel CI/CD
       │ build + test
       ▼
Vercel Production (civicai.vercel.app)
       │
       ├── Edge Middleware (auth checks, rate limiting)
       ├── SSR Pages (Vercel Serverless Functions)
       └── API Routes (Vercel Serverless Functions)
                │
                ├── Supabase (ap-southeast-1 / closest African region)
                └── OpenAI API / Google Cloud APIs
```

### Environment Strategy

| Environment | Branch | URL |
|---|---|---|
| Development | `dev` | localhost:3000 |
| Staging | `staging` | civicai-staging.vercel.app |
| Production | `main` | civicai.vercel.app |

---

## 5. Scalability Considerations (Post-MVP)

| Bottleneck | Current (MVP) | Future Solution |
|---|---|---|
| AI processing | Synchronous API call | Background job queue (BullMQ + Redis) |
| File storage | Supabase free tier (1GB) | Supabase Pro or S3 |
| Database | Supabase free (500MB) | Supabase Pro with read replicas |
| Auth | Supabase Auth | Same (scales well) |
| Deployment | Vercel Hobby | Vercel Pro or self-hosted |
| Audio generation | Per-request Google TTS | Pre-generate + cache all audio |

---

## 6. Third-Party Integrations

| Service | Purpose | Fallback |
|---|---|---|
| OpenAI GPT-4o | Policy summarization | GPT-3.5-turbo (cheaper) |
| Google Cloud TTS | Audio generation | ElevenLabs, or browser Web Speech API |
| Supabase | Auth + DB + Storage | N/A (core dependency) |
| Vercel | Hosting + CDN | N/A for MVP |
| Google OAuth | Social login | Email/password only |
