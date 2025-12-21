-- ==========================================
-- HARTABONA CONSOLIDATED DEPLOYMENT SCRIPT
-- ==========================================
-- This script sets up the entire database schema for Hartabona.
-- Run this in the Supabase SQL Editor.

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Core Tables
-- Games table
create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  status text not null default 'lobby' check (status in ('lobby', 'writing_truths', 'playing', 'finished')),
  current_round_index int not null default 0,
  mode text not null default 'classic' check (mode in ('classic', 'trivia')),
  allow_skip boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Players table
create table if not exists public.players (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  name text not null,
  avatar_seed text not null,
  score int not null default 0,
  true_statement text,
  is_host boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trivia Questions table
create table if not exists public.trivia_questions (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  text text not null,
  answer text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'used')),
  suggested_by_player_id uuid references public.players(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rounds table
create table if not exists public.rounds (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  subject_player_id uuid references public.players(id), -- Nullable for trivia mode
  question_id uuid references public.trivia_questions(id),
  status text not null default 'fabricating' check (status in ('fabricating', 'voting', 'reveal')),
  round_order int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Answers table
create table if not exists public.answers (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references public.rounds(id) on delete cascade not null,
  player_id uuid references public.players(id) not null,
  text text not null,
  is_truth boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Votes table
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references public.rounds(id) on delete cascade not null,
  voter_id uuid references public.players(id) not null,
  answer_id uuid references public.answers(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Realtime Configuration
-- Note: You may need to enable realtime for these tables in the Supabase Dashboard as well.
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.rounds;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.trivia_questions;

-- 4. Permissions & RLS
-- For this project, we are disabling RLS to allow anonymous play.
alter table public.games disable row level security;
alter table public.players disable row level security;
alter table public.rounds disable row level security;
alter table public.answers disable row level security;
alter table public.votes disable row level security;
alter table public.trivia_questions disable row level security;

-- Grant permissions to anon role
grant usage on schema public to anon;
grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================
