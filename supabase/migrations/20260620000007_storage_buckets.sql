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

-- Authenticated users can read documents
CREATE POLICY "documents: authenticated read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'policy-documents' AND auth.role() = 'authenticated');

-- Audio is public
CREATE POLICY "audio: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'policy-audio');