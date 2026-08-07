-- Fix: "Database error saving new user" during signup
-- Run this in Supabase SQL Editor

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    state,
    district,
    city,
    ward,
    is_verified,
    avatar_url,
    latitude,
    longitude,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'ward', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_verified')::boolean, false),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.raw_user_meta_data->>'latitude' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'latitude')::double precision 
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'longitude' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'longitude')::double precision 
      ELSE NULL 
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Make fields nullable to prevent errors
ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN state DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN district DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN city DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN ward DROP NOT NULL;

-- Verify
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
