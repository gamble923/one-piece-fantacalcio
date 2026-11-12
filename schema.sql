create extension if not exists pgcrypto;

create table if not exists public.tournaments(
 id uuid primary key default gen_random_uuid(), name text not null, season text,
 team_count int not null check(team_count in(8,10)), is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.teams(
 id uuid primary key default gen_random_uuid(), tournament_id uuid not null references public.tournaments(id) on delete cascade,
 name text not null, created_at timestamptz not null default now()
);
create table if not exists public.team_members(
 id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
 name text not null, created_at timestamptz not null default now()
);
create table if not exists public.matchdays(
 id uuid primary key default gen_random_uuid(), tournament_id uuid not null references public.tournaments(id) on delete cascade,
 number int not null, unique(tournament_id,number)
);
create table if not exists public.matches(
 id uuid primary key default gen_random_uuid(), tournament_id uuid not null references public.tournaments(id) on delete cascade,
 matchday_number int not null, home_team_id uuid not null references public.teams(id) on delete cascade,
 away_team_id uuid not null references public.teams(id) on delete cascade, home_score numeric, away_score numeric,
 created_at timestamptz not null default now(),
 check(home_team_id<>away_team_id),
 check((home_score is null and away_score is null) or (home_score is not null and away_score is not null and home_score>=0 and away_score>=0))
);

alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.matchdays enable row level security;
alter table public.matches enable row level security;

create policy "public read tournaments" on public.tournaments for select using(true);
create policy "public read teams" on public.teams for select using(true);
create policy "public read members" on public.team_members for select using(true);
create policy "public read matchdays" on public.matchdays for select using(true);
create policy "public read matches" on public.matches for select using(true);

-- Solo l'account amministratore deve essere creato in Supabase Auth.
create policy "authenticated write tournaments" on public.tournaments for all to authenticated using(true) with check(true);
create policy "authenticated write teams" on public.teams for all to authenticated using(true) with check(true);
create policy "authenticated write members" on public.team_members for all to authenticated using(true) with check(true);
create policy "authenticated write matchdays" on public.matchdays for all to authenticated using(true) with check(true);
create policy "authenticated write matches" on public.matches for all to authenticated using(true) with check(true);
