-- Add new fields to profiles table for officer information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS steam_name TEXT,
ADD COLUMN IF NOT EXISTS steam_url TEXT,
ADD COLUMN IF NOT EXISTS license_id TEXT,
ADD COLUMN IF NOT EXISTS ic_phone TEXT,
ADD COLUMN IF NOT EXISTS discord TEXT,
ADD COLUMN IF NOT EXISTS state_id TEXT;