-- 20260620000003_policies.sql
-- Core policies table with full-text search indexes

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