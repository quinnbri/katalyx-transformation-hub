
-- Add org metadata columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS tech_team_size text,
  ADD COLUMN IF NOT EXISTS infrastructure_type text,
  ADD COLUMN IF NOT EXISTS cloud_providers text[],
  ADD COLUMN IF NOT EXISTS annual_revenue text,
  ADD COLUMN IF NOT EXISTS headquarters_region text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
