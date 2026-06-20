-- 20260620000004_feedback.sql
-- Citizen feedback on policies

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