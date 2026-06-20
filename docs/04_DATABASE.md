# CivicAI — Database Design Document

**Version:** 1.0  
**Date:** June 2026  
**Database:** PostgreSQL 15 (via Supabase)

---

## 1. Entity Relationship Overview

```
users ────────────────────────┐
  │                           │
  │ (submits)                 │ (uploads)
  ▼                           ▼
feedback ──────────── policies ──────── processing_jobs
                          │
                          └──── categories (lookup)
```

---

## 2. Schema — Full Table Definitions

### 2.1 `users` (managed by Supabase Auth)

Supabase Auth creates and manages the `auth.users` table automatically. We extend it with a `public.profiles` table.

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'citizen'  -- 'citizen' | 'admin'
                CHECK (role IN ('citizen', 'admin')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 2.2 `categories`

```sql
CREATE TABLE public.categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,  -- e.g. 'Health', 'Education', 'Finance'
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO public.categories (name, slug) VALUES
  ('Health', 'health'),
  ('Education', 'education'),
  ('Finance & Budget', 'finance'),
  ('Environment', 'environment'),
  ('Infrastructure', 'infrastructure'),
  ('Agriculture', 'agriculture'),
  ('Security & Defence', 'security'),
  ('Land & Housing', 'land'),
  ('General', 'general');
```

---

### 2.3 `policies` (core table)

```sql
CREATE TABLE public.policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  ministry        TEXT NOT NULL,
  category_id     INT REFERENCES public.categories(id),
  
  -- File storage
  document_url    TEXT NOT NULL,          -- Supabase Storage URL (original file)
  document_type   TEXT NOT NULL           -- 'pdf' | 'docx'
                  CHECK (document_type IN ('pdf', 'docx')),
  file_size_bytes BIGINT,
  
  -- AI-generated content
  extracted_text  TEXT,                   -- Full extracted text (stored for re-processing)
  summary         TEXT,                   -- AI-generated plain-English summary
  audio_url       TEXT,                   -- Supabase Storage URL (MP3 audio)
  
  -- Status
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  
  -- Metadata
  uploaded_by     UUID REFERENCES public.profiles(id),
  published_at    TIMESTAMPTZ,            -- NULL = draft, set = published
  effective_date  DATE,                   -- Policy effective date
  
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast search and filtering
CREATE INDEX idx_policies_status      ON public.policies(status);
CREATE INDEX idx_policies_category    ON public.policies(category_id);
CREATE INDEX idx_policies_ministry    ON public.policies(ministry);
CREATE INDEX idx_policies_published   ON public.policies(published_at);

-- Full-text search index
CREATE INDEX idx_policies_fts ON public.policies
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(summary, '')));
```

---

### 2.4 `feedback`

```sql
CREATE TABLE public.feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id     UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  content       TEXT NOT NULL
                CHECK (char_length(content) >= 10 AND char_length(content) <= 2000),
  
  -- Admin tracking
  status        TEXT NOT NULL DEFAULT 'unreviewed'
                CHECK (status IN ('unreviewed', 'reviewed', 'flagged')),
  reviewed_by   UUID REFERENCES public.profiles(id),
  reviewed_at   TIMESTAMPTZ,
  
  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_policy   ON public.feedback(policy_id);
CREATE INDEX idx_feedback_user     ON public.feedback(user_id);
CREATE INDEX idx_feedback_status   ON public.feedback(status);

-- One feedback per user per policy (can be relaxed later)
CREATE UNIQUE INDEX idx_feedback_unique_user_policy
  ON public.feedback(user_id, policy_id);
```

---

### 2.5 `processing_jobs`

```sql
CREATE TABLE public.processing_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id     UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  job_type      TEXT NOT NULL
                CHECK (job_type IN ('summarize', 'tts')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'running', 'done', 'failed')),
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_policy  ON public.processing_jobs(policy_id);
CREATE INDEX idx_jobs_status  ON public.processing_jobs(status);
```

---

## 3. Row Level Security (RLS) Policies

RLS is enforced at the database level — even if the API has a bug, data access is still restricted.

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- ─── profiles ───────────────────────────────────────────────
-- Users can only read/update their own profile
CREATE POLICY "profiles: own access"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- ─── policies ───────────────────────────────────────────────
-- Public can read published policies
CREATE POLICY "policies: public read published"
  ON public.policies FOR SELECT
  USING (published_at IS NOT NULL AND status = 'ready');

-- Admins can do everything
CREATE POLICY "policies: admin full access"
  ON public.policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── feedback ───────────────────────────────────────────────
-- Users can read their own feedback
CREATE POLICY "feedback: own read"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert feedback
CREATE POLICY "feedback: authenticated insert"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback
CREATE POLICY "feedback: admin read all"
  ON public.feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update feedback status
CREATE POLICY "feedback: admin update"
  ON public.feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 4. Storage Buckets (Supabase Storage)

```sql
-- Policy documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy-documents', 'policy-documents', false);

-- Audio files bucket (public — citizens stream without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy-audio', 'policy-audio', true);

-- Storage RLS: only admins can upload
CREATE POLICY "documents: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'policy-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can read documents
CREATE POLICY "documents: authenticated read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'policy-documents' AND auth.role() = 'authenticated');

-- Audio is public
CREATE POLICY "audio: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'policy-audio');
```

---

## 5. Useful Queries

### Full-text policy search
```sql
SELECT id, title, ministry, summary
FROM public.policies
WHERE to_tsvector('english', title || ' ' || COALESCE(summary, ''))
      @@ plainto_tsquery('english', 'health insurance')
AND published_at IS NOT NULL
ORDER BY created_at DESC;
```

### Feedback count per policy
```sql
SELECT p.id, p.title, COUNT(f.id) AS feedback_count
FROM public.policies p
LEFT JOIN public.feedback f ON f.policy_id = p.id
GROUP BY p.id, p.title
ORDER BY feedback_count DESC;
```

### Pending processing jobs
```sql
SELECT pj.*, p.title
FROM public.processing_jobs pj
JOIN public.policies p ON p.id = pj.policy_id
WHERE pj.status IN ('pending', 'running')
ORDER BY pj.created_at ASC;
```

---

## 6. Database Migrations Strategy

All schema changes are tracked as numbered SQL migration files:

```
supabase/migrations/
├── 20260620_001_init_profiles.sql
├── 20260620_002_categories.sql
├── 20260620_003_policies.sql
├── 20260620_004_feedback.sql
├── 20260620_005_processing_jobs.sql
├── 20260620_006_rls_policies.sql
└── 20260620_007_storage_buckets.sql
```

Run via Supabase CLI:
```bash
supabase db push
```
