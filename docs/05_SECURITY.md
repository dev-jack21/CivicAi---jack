# CivicAI — Security Document

**Version:** 1.0  
**Date:** June 2026

---

## 1. Security Overview

CivicAI handles citizen personal data (emails, feedback), government documents, and AI-generated content. While not classified, the platform must protect citizen privacy and prevent unauthorized data access or content tampering.

### Security Layers

```
User Request
    │
    ▼
[1] TLS 1.3 (Vercel HTTPS)
    │
    ▼
[2] Edge Middleware (rate limiting, auth check)
    │
    ▼
[3] API Route Validation (Zod schema validation)
    │
    ▼
[4] Supabase Auth (JWT verification)
    │
    ▼
[5] Row Level Security (PostgreSQL RLS)
    │
    ▼
[6] Supabase Storage Policies
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow

```
User enters credentials
      │
      ▼
Supabase Auth (email/password or Google OAuth)
      │
      ▼
Supabase issues signed JWT (RS256)
      │
      ▼
JWT stored in httpOnly cookie (not localStorage)
      │
      ▼
Next.js middleware validates JWT on every request
      │
      ├── Valid + admin role  → admin route
      ├── Valid + citizen     → protected citizen route
      └── Invalid / missing  → redirect to /login
```

### 2.2 JWT Configuration

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return res
}
```

### 2.3 Role-Based Access Control (RBAC)

| Action | Citizen (unauthenticated) | Citizen (authenticated) | Admin |
|---|---|---|---|
| View published policies | ✅ | ✅ | ✅ |
| Listen to audio | ✅ | ✅ | ✅ |
| Submit feedback | ❌ | ✅ | ✅ |
| Upload policy | ❌ | ❌ | ✅ |
| View all feedback | ❌ | ❌ | ✅ |
| Delete policy | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## 3. Input Validation & Sanitization

All user input is validated using **Zod** on both client and server side.

```typescript
// lib/validators/feedback.ts
import { z } from 'zod'

export const feedbackSchema = z.object({
  content: z.string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(2000, 'Feedback cannot exceed 2000 characters')
    .trim()
})

export const policyUploadSchema = z.object({
  title: z.string().min(5).max(255).trim(),
  ministry: z.string().min(2).max(100).trim(),
  category_id: z.number().int().positive(),
  description: z.string().max(1000).trim().optional()
})
```

### File Upload Validation

```typescript
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_FILE_SIZE = 20 * 1024 * 1024  // 20MB

function validateUpload(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF and DOCX files are allowed' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must not exceed 20MB' }
  }
  return { valid: true }
}
```

---

## 4. Data Protection

### 4.1 Sensitive Data Handling

| Data | Storage | Encryption |
|---|---|---|
| User passwords | Supabase Auth (bcrypt) | ✅ bcrypt hashed |
| JWT tokens | httpOnly cookie | ✅ signed RS256 |
| Email addresses | PostgreSQL | ✅ at rest (AES-256) |
| Feedback content | PostgreSQL | ✅ at rest |
| Policy documents | Supabase Storage | ✅ at rest |
| Audio files | Supabase Storage (public) | ✅ at rest (public access) |
| AI summary text | PostgreSQL | ✅ at rest |
| OpenAI API key | Env variable (server only) | ✅ never exposed to client |

### 4.2 Environment Variables Security

- All API keys stored in Vercel environment variables (encrypted at rest)
- `NEXT_PUBLIC_` prefix only used for keys that are safe to expose (Supabase anon key)
- `SUPABASE_SERVICE_ROLE_KEY` — server only, never in client bundle
- `OPENAI_API_KEY` — server only, never in client bundle
- Env vars never committed to GitHub (`.env.local` in `.gitignore`)

---

## 5. API Security

### 5.1 Rate Limiting

```typescript
// middleware.ts — rate limiting per IP
const rateLimit = new Map()

function checkRateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  const requests = rateLimit.get(ip) || []
  const recentRequests = requests.filter((t: number) => t > windowStart)
  
  if (recentRequests.length >= limit) return false
  
  recentRequests.push(now)
  rateLimit.set(ip, recentRequests)
  return true
}
```

### 5.2 CORS Policy

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### 5.3 Security Headers

```typescript
// next.config.ts — security headers
{
  key: 'X-Frame-Options', value: 'DENY'
},
{
  key: 'X-Content-Type-Options', value: 'nosniff'
},
{
  key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'
},
{
  key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'
},
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval'; img-src 'self' data: https:; media-src 'self' https://your-supabase.supabase.co"
}
```

---

## 6. XSS & Injection Prevention

- All user-generated content rendered with `dangerouslySetInnerHTML` is **never used** — React escapes by default
- AI-generated summaries are treated as untrusted text (not HTML)
- Supabase parameterized queries prevent SQL injection
- File names sanitized before storage: `file.name.replace(/[^a-zA-Z0-9._-]/g, '_')`
- PDF/DOCX extraction libraries run in sandboxed API routes, not browser

---

## 7. Data Privacy (Kenya Data Protection Act 2019)

CivicAI complies with the **Kenya Data Protection Act 2019** (KDPA):

| Requirement | Implementation |
|---|---|
| Lawful basis for processing | Consent at registration; civic participation interest |
| Data minimization | Only email, name, and feedback content collected |
| Right to access | Users can view their own feedback via profile page |
| Right to delete | Users can delete their account (cascade deletes feedback) |
| Data breach notification | Vercel alerts + Supabase audit logs; 72hr notification target |
| Data retention | Feedback retained indefinitely; account data deleted on request |
| Cross-border transfers | Supabase EU/US region — acceptable under KDPA |

### Privacy Policy Must Include
- What data is collected (email, feedback)
- How it is used (civic participation, no ad targeting)
- Who it is shared with (no third parties except OpenAI for summarization, anonymized)
- How to request deletion

---

## 8. Dependency & Supply Chain Security

```bash
# Run before every release
npm audit
npm audit fix

# Check for known vulnerabilities
npx snyk test
```

- Dependencies pinned in `package-lock.json`
- GitHub Dependabot enabled for auto security PR updates
- No direct use of `eval()` or `Function()` constructor

---

## 9. Admin Account Security

- Initial admin account created via Supabase dashboard (not public registration)
- Admin role set manually in `profiles` table by superadmin
- Admin login uses same Supabase Auth but with role check in middleware
- Recommendation: Enable MFA for admin accounts post-MVP via Supabase Auth MFA

---

## 10. Incident Response Plan

| Severity | Description | Response Time | Action |
|---|---|---|---|
| P1 (Critical) | Data breach / mass exposure | 1 hour | Take down, notify affected users, contact Supabase |
| P2 (High) | Auth bypass / unauthorized admin access | 4 hours | Revoke sessions, patch, re-deploy |
| P3 (Medium) | API abuse / rate limit bypass | 24 hours | Update rate limits, block IP |
| P4 (Low) | XSS attempt logged | 72 hours | Review CSP headers, patch |

Contacts: Team lead (Jack Mula) → Supabase support → Vercel support → University supervisor
