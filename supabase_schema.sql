-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Games table
create table public.games (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  status text not null default 'lobby' check (status in ('lobby', 'writing_truths', 'playing', 'finished')),
  current_round_index int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Players table
create table public.players (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  name text not null,
  avatar_seed text not null,
  score int not null default 0,
  true_statement text,
  is_host boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rounds table
create table public.rounds (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  subject_player_id uuid references public.players(id) not null,
  status text not null default 'fabricating' check (status in ('fabricating', 'voting', 'reveal')),
  round_order int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Answers table
create table public.answers (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references public.rounds(id) on delete cascade not null,
  player_id uuid references public.players(id) not null,
  text text not null,
  is_truth boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Votes table
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references public.rounds(id) on delete cascade not null,
  voter_id uuid references public.players(id) not null,
  answer_id uuid references public.answers(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Realtime publication
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.rounds;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.votes;
