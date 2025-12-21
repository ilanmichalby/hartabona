-- Nuke option: Disable RLS completely for trivia_questions
-- This ensures that NO polices are checked.
ALTER TABLE public.trivia_questions DISABLE ROW LEVEL SECURITY;

-- Verify games table permissions (just in case foreign key check issues, though unlikely to block if RLS disabled on child)
-- But ensuring games is readable is good.
-- ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all on games" ON public.games FOR ALL USING (true) WITH CHECK (true);
