-- Enable RLS on trivia_questions
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read trivia questions (for now due to game logic)
-- Or better, allow authenticated users to read
CREATE POLICY "Enable read access for all users" ON public.trivia_questions
    FOR SELECT USING (true);

-- Allow authenticated users to insert (for suggestions and host)
CREATE POLICY "Enable insert for authenticated users" ON public.trivia_questions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow host (or anyone for simplicity/debugging) to delete
CREATE POLICY "Enable delete for authenticated users" ON public.trivia_questions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Also ensure rounds RLS allows reading question_id
-- (Assuming rounds already has policies, but just in case)
-- ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON public.rounds FOR SELECT USING (true);
