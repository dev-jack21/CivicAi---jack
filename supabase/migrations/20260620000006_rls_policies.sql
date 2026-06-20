-- 20260620000006_rls_policies.sql
-- Row Level Security policies — all tables

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

-- Additional policy: public read on published policies
-- This policy is needed because the existing "own read" and "admin read all"
-- policies don't cover the public-facing feedback list described in the UI/UX
-- spec (section 4.3). Without it, any visitor who isn't the comment's author
-- or an admin would see zero rows when browsing feedback on a published policy.
CREATE POLICY "feedback: public read on published policies"
  ON public.feedback FOR SELECT
  USING (
    status != 'flagged'
    AND EXISTS (
      SELECT 1 FROM public.policies
      WHERE id = feedback.policy_id
      AND published_at IS NOT NULL
      AND status = 'ready'
    )
  );