-- Drop previous policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.trivia_questions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.trivia_questions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.trivia_questions;

-- Enable RLS (if not already enabled)
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to read trivia questions (anon users need this)
CREATE POLICY "Allow public read access" ON public.trivia_questions
    FOR SELECT USING (true);

-- Allow ANYONE to insert trivia questions (anon users need this for suggestions)
-- In a real app, you might want to link this to a game_id or player session, but for now we trust the client.
CREATE POLICY "Allow public insert access" ON public.trivia_questions
    FOR INSERT WITH CHECK (true);

-- Allow ANYONE to delete (host needs this, and host is anon)
CREATE POLICY "Allow public delete access" ON public.trivia_questions
    FOR DELETE USING (true);

-- Ensure other tables are accessible if needed (though existing game likely handles this differently)
-- This script focuses on fixing the new table issues.
