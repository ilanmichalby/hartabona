-- Disable RLS on all tables to allow anonymous access
alter table public.games disable row level security;
alter table public.players disable row level security;
alter table public.rounds disable row level security;
alter table public.answers disable row level security;
alter table public.votes disable row level security;

-- Grant permissions to anon role (just in case)
grant usage on schema public to anon;
grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;
