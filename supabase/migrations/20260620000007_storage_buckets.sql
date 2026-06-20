-- 20260620000007_storage_buckets.sql
-- Supabase Storage buckets and their RLS policies

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

-- Authenticated users can read documents only if they are admins or if the document is published
CREATE POLICY "documents: authenticated read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'policy-documents' AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      EXISTS (
        SELECT 1 FROM public.policies p
        WHERE p.document_url LIKE '%' || name
        AND p.status = 'ready'
        AND p.published_at IS NOT NULL
      )
    )
  );

-- Audio is public only if it is published or if the user is an admin
CREATE POLICY "audio: public read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'policy-audio' AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      EXISTS (
        SELECT 1 FROM public.policies p
        WHERE p.audio_url LIKE '%' || name
        AND p.status = 'ready'
        AND p.published_at IS NOT NULL
      )
    )
  );