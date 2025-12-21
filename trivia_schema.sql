-- Create trivia_questions table FIRST (so it can be referenced)
CREATE TABLE IF NOT EXISTS public.trivia_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  answer text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'used')),
  suggested_by_player_id uuid REFERENCES public.players(id),
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add mode column to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'classic' CHECK (mode IN ('classic', 'trivia'));

-- Add question_id column to rounds table (referencing the now existing trivia_questions table)
ALTER TABLE public.rounds
ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.trivia_questions(id);

-- Make subject_player_id nullable (since trivia rounds don't have a specific subject player)
ALTER TABLE public.rounds
ALTER COLUMN subject_player_id DROP NOT NULL;

-- Add Realtime publication for new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trivia_questions;
