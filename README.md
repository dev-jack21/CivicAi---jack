# CivicAI — AI-Powered Accessible Public Participation Portal

> **Understand Government Policies in Plain English**

CivicAI is a web platform that makes Kenyan government policy documents accessible to all citizens, regardless of literacy level, disability, or internet bandwidth. It is built by **Group 2, INTE 324 — Kabarak University (June 2026).**

**Live:** [civicai-sable.vercel.app](https://civicai-sable.vercel.app/)

## The Problem

Kenya's Constitution (Article 118) mandates public participation in policy-making, but most government documents are:
- Written in dense legal/technical English
- Available only as PDFs with no audio alternatives
- Not optimized for mobile or low-bandwidth users

## What It Does

1. **Converts** complex PDF/DOCX policies into plain-English summaries using Google Gemini AI
2. **Narrates** summaries as MP3 audio via text-to-speech (Kenyan English voice)
3. **Displays** policies in an accessible viewer with high-contrast mode, font-size controls, and full screen-reader support (WCAG 2.1 AA)
4. **Collects** citizen feedback on each policy (login required, one response per person per policy)
5. **Provides** an admin dashboard for uploading documents, managing policies, and reviewing feedback

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| Database & Auth | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage) |
| AI | Google Gemini 2.0 Flash (summarization), edge-tts / gTTS (TTS) |
| Validation | Zod 4 + React Hook Form 7 |
| Deployment | Vercel (CI/CD, Edge Middleware, Serverless Functions) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Google Gemini API key

### Setup

```bash
# Clone and install
npm install

# Copy environment variables
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `TTS_PRIMARY_ENGINE` | `edge` (default) or `gtts` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server (no warnings) |
| `npm run build` | Production build |
| `npm run start` | Start production server (no warnings) |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── (public)/      # Public pages (landing, policies, about, etc.)
│   ├── (auth)/        # Login / Register
│   ├── (admin)/       # Admin dashboard (upload, manage, review)
│   └── api/           # REST API routes (upload, policies, feedback, process)
├── components/
│   ├── ui/            # Base primitives (Button, Input, Select, etc.)
│   ├── layout/        # Navbar, Footer, SkipNav
│   ├── policy/        # PolicyCard, PolicyList, AudioPlayer, filters
│   ├── feedback/      # FeedbackForm, FeedbackList
│   └── admin/         # FeedbackTable
├── lib/
│   ├── supabase/      # Browser & server Supabase clients
│   ├── ai/            # Gemini summarizer, TTS engine
│   ├── parsers/       # PDF & DOCX text extraction
│   └── process/       # AI pipeline orchestrator
├── hooks/             # useConfirm
└── types/             # Shared TypeScript interfaces

docs/                  # Full project documentation (PRD, Tech Spec, Architecture, Database, Security, UI/UX)
supabase/migrations/   # Database schema (8 migration files)
```

## Key Features

- **Role-based access** — Citizens browse & give feedback; admins upload & manage
- **AI pipeline** — Upload triggers text extraction → Gemini summarization → TTS narration automatically
- **Accessibility** — High-contrast toggle, 4-step font sizing, skip-to-content, keyboard-navigable audio player, ARIA labels
- **Mobile-first** — Responsive design with 44px minimum touch targets
- **Security** — CSP headers, rate limiting (middleware), Zod validation (client + server), RLS on all tables, JWT in httpOnly cookies

## Architecture

```
User → Vercel Edge (middleware: auth + rate limit) → Next.js SSR / API Route
                                                          ↕
                                                    Supabase
                                                  (DB + Auth + Storage)
                                                          ↕
                                              Gemini API / edge-tts
```

## Documentation

Full project documentation is available in [`docs/`](docs/):
- [Product Requirements Document](docs/01_PRD.md)
- [Technical Specification](docs/02_TECH_SPEC.md)
- [System Architecture](docs/03_ARCHITECTURE.md)
- [Database Design](docs/04_DATABASE.md)
- [Security Document](docs/05_SECURITY.md)
- [UI/UX Specification](docs/06_UI_UX_SPEC.md)

## Team

- Jack Mula
- Simon Njoroge Wangui
- Shelton Mumo
- Carson Ombane
