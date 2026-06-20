-- 20260620000005_processing_jobs.sql
-- AI processing jobs tracking table

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