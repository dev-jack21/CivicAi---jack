# CivicAI — Technical Specification Document

**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft

---

## 1. Technology Stack

### 1.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15 (App Router) | React framework, SSR/SSG |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Accessible UI component library |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation (client + server) |
| Lucide React | latest | Icon library |
| React Player / HTML5 Audio | — | Audio playback |
| Axios / fetch | — | HTTP client |

### 1.2 Backend

| Technology | Version | Purpose |
|---|---|---|
| Next.js API Routes | 15 | Backend API (monorepo) |
| Node.js | 20 LTS | Runtime |
| Supabase | latest | Auth + Database + Storage |
| Google Gemini SDK | 0.24.x | AI summarization (Gemini 2.0 Flash) |
| edge-tts | latest | Primary text-to-speech (Kenyan English voice) |
| gTTS | latest | Fallback text-to-speech (no API key needed) |
| pdf-parse | 2.x | PDF text extraction |
| mammoth | latest | DOCX text extraction |
| Vercel | — | Deployment + Edge Functions |

### 1.3 Database

| Technology | Purpose |
|---|---|
| PostgreSQL (via Supabase) | Primary relational database |
| Supabase Storage | File storage (PDFs, audio) |
| Supabase Auth | User auth + JWT |

### 1.4 DevOps & Tooling

| Tool | Purpose |
|---|---|
| GitHub | Version control |
| Vercel | CI/CD + Hosting |
| Figma | UI/UX design |
| ESLint + Prettier | Code quality |
| Husky | Pre-commit hooks |

---

## 2. Project Structure

```
civicai/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (public)/
│   │   ├── page.tsx              # Home / policy listing
│   │   ├── policies/
│   │   │   ├── page.tsx          # All policies
│   │   │   └── [id]/page.tsx     # Single policy view
│   │   └── search/page.tsx
│   ├── (admin)/
│   │   ├── dashboard/page.tsx
│   │   ├── upload/page.tsx
│   │   └── feedback/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── policies/
│       │   ├── route.ts           # GET all, POST upload
│       │   └── [id]/
│       │       ├── route.ts       # GET, DELETE
│       │       └── feedback/route.ts
│       ├── process/
│       │   ├── summarize/route.ts
│       │   └── tts/route.ts
│       └── upload/route.ts
│
├── components/
│   ├── ui/                        # shadcn/ui base components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── SkipNav.tsx            # Accessibility skip link
│   ├── policy/
│   │   ├── PolicyCard.tsx
│   │   ├── PolicyList.tsx
│   │   ├── PolicyViewer.tsx
│   │   └── AudioPlayer.tsx
│   ├── feedback/
│   │   └── FeedbackForm.tsx
│   └── admin/
│       ├── UploadForm.tsx
│       └── FeedbackTable.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   └── server.ts              # Server client
│   ├── ai/
│   │   ├── summarize.ts           # Gemini summarization
│   │   └── tts.ts                 # Text-to-speech
│   ├── parsers/
│   │   ├── pdf.ts                 # pdf-parse wrapper
│   │   └── docx.ts                # mammoth wrapper
│   └── utils.ts
│
├── types/
│   └── index.ts                   # Global TypeScript types
│
├── middleware.ts                   # Auth protection middleware
├── .env.local                      # Environment variables
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 3. API Design

### 3.1 RESTful API Endpoints

#### Authentication
```
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # Login (handled by Supabase)
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Get current user
```

#### Policies
```
GET    /api/policies            # List all policies (paginated)
POST   /api/policies            # Upload new policy (admin only)
GET    /api/policies/:id        # Get single policy + summary
DELETE /api/policies/:id        # Delete policy (admin only)
```

#### AI Processing
```
POST   /api/process/summarize   # Trigger AI summary for a policy
POST   /api/process/tts         # Generate audio for a policy
GET    /api/process/status/:id  # Check processing status
```

#### Feedback
```
GET    /api/policies/:id/feedback   # Get feedback for policy (admin)
POST   /api/policies/:id/feedback   # Submit feedback (auth required)
PATCH  /api/feedback/:id            # Mark feedback reviewed (admin)
```

#### Upload
```
POST   /api/upload              # Upload file to Supabase Storage
```

### 3.2 Request/Response Examples

**POST /api/policies** (multipart/form-data)
```json
Request:
{
  "title": "National Health Policy 2024",
  "ministry": "Ministry of Health",
  "category": "Health",
  "description": "...",
  "file": <PDF/DOCX binary>
}

Response 201:
{
  "id": "uuid",
  "title": "National Health Policy 2024",
  "status": "processing",
  "created_at": "2026-06-20T10:00:00Z"
}
```

**GET /api/policies/:id**
```json
Response 200:
{
  "id": "uuid",
  "title": "National Health Policy 2024",
  "ministry": "Ministry of Health",
  "category": "Health",
  "summary": "This policy outlines...",
  "audio_url": "https://storage.supabase.co/...",
  "document_url": "https://storage.supabase.co/...",
  "status": "ready",
  "created_at": "2026-06-20T10:00:00Z",
  "feedback_count": 12
}
```

---

## 4. AI Processing Pipeline

```
Upload → Extract Text → Chunk Text → Summarize (Gemini) → Store Summary
                                                    ↓
                                         Generate Audio (TTS)
                                                    ↓
                                         Store Audio → Update Status → Notify
```

### 4.1 Summarization Prompt (Gemini 2.0 Flash)

```
System: You are a plain-language government policy expert for Kenya. 
        Simplify the following policy document for a general Kenyan citizen.
        Use short sentences. Avoid jargon. Be factual and neutral.
        Output in 3 sections: Key Points (bullet list), What This Means for You, Next Steps.

User: [Extracted policy text — chunked at 4000 tokens]
```

### 4.2 Text-to-Speech

- Primary provider: **edge-tts** (Microsoft Edge TTS service, free, no API key)
  - Voice: `en-KE-AsiliaNeural` (Kenyan English, Female) or `en-KE-ChilembaNeural` (Male)
- Fallback provider: **gTTS** (Google Translate TTS, free, no API key, English)
- Configurable via `TTS_PRIMARY_ENGINE` env var (`edge` or `gtts`)
- Format: MP3 (from edge-tts), 64kbps target (for bandwidth efficiency)
- Max summary length for TTS: 1500 words

---

## 5. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI — Gemini (replaces OpenAI)
GEMINI_API_KEY=

# Text-to-Speech (edge-tts is primary, gTTS is fallback — neither needs an API key)
# TTS_PRIMARY_ENGINE=edge   # set to "gtts" to prefer gTTS over edge-tts

# Next Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 6. Error Handling

All API routes return structured errors:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "The requested policy document does not exist.",
    "status": 404
  }
}
```

### Standard Error Codes

| Code | HTTP | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request body |
| `PROCESSING_FAILED` | 500 | AI pipeline error |
| `FILE_TOO_LARGE` | 413 | Upload exceeds 20MB limit |
| `UNSUPPORTED_FORMAT` | 415 | Not PDF or DOCX |

---

## 7. Performance Considerations

- Summaries are cached in the database — never re-generated unless re-uploaded
- Audio files are stored in Supabase Storage with CDN — not re-generated
- Next.js ISR (Incremental Static Regeneration) for policy listing pages
- Image/document lazy loading
- Audio files served via CDN edge, not origin server
- API routes protected by rate limiting middleware (100 req/min per IP)
