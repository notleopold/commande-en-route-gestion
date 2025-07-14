-- Add last_login_at field to profiles table
ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;

-- Update existing profiles to have a default last_login_at value
UPDATE public.profiles SET last_login_at = now() WHERE last_login_at IS NULL;