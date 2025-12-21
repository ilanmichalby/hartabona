-- Add allow_skip column to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS allow_skip boolean NOT NULL DEFAULT true;
