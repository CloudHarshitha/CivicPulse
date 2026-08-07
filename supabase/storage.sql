-- CivicPulse Supabase Storage Bucket Setup Script
-- Run this in your Supabase SQL Editor to enable public image uploads for tickets and proof of work

-- 1. Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES
  ('issue-photos', 'issue-photos', true),
  ('resolution-photos', 'resolution-photos', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for `issue-photos` bucket
CREATE POLICY "Public Read issue-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-photos');

CREATE POLICY "Authenticated Upload issue-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'issue-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Owner Delete issue-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'issue-photos' AND auth.uid() = owner);

-- 3. Storage Policies for `resolution-photos` bucket
CREATE POLICY "Public Read resolution-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resolution-photos');

CREATE POLICY "Authenticated Upload resolution-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resolution-photos' AND auth.role() = 'authenticated');

-- 4. Storage Policies for `avatars` bucket
CREATE POLICY "Public Read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
