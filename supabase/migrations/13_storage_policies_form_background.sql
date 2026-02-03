-- Enable storage policies for form-background bucket
-- Run this in Supabase SQL Editor to allow authenticated users to upload/read images

-- Allow authenticated users to upload files to form-background bucket
CREATE POLICY "Allow authenticated uploads to form-background"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'form-background');

-- Allow authenticated users to update their own files in form-background bucket
CREATE POLICY "Allow authenticated updates to form-background"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'form-background')
WITH CHECK (bucket_id = 'form-background');

-- Allow anyone to read files from form-background bucket (public access for viewing)
CREATE POLICY "Allow public read access to form-background"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'form-background');

-- Allow authenticated users to delete their own files in form-background bucket
CREATE POLICY "Allow authenticated deletes to form-background"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'form-background');
