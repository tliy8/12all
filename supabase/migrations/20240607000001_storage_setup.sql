-- Create 'media' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies
-- 1. Allow public to read media
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media' );

-- 2. Allow public to upload media (For local dev/personal tool)
CREATE POLICY "Public upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'media' );

-- 3. Allow public to update/delete media
CREATE POLICY "Public update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'media' );

CREATE POLICY "Public delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'media' );
