-- IRONLOG schema. Paste this whole file into Supabase → SQL Editor → Run.
-- Row Level Security is on everywhere: a user can only ever touch their own rows.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  display_name text,
  tier        text not null default 'free' check (tier in ('free','plus','coached')),
  unit        text not null default 'kg'  check (unit in ('kg','lb')),
  bar_kg      numeric not null default 20,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile: read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile: update" on public.profiles for update using (auth.uid() = id);

-- Create a profile row automatically whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- exercises
-- Shared library (user_id null) plus each user's own custom exercises.
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade,
  name         text not null,
  muscle_group text,
  equipment    text,            -- barbell | dumbbell | machine | cable | bodyweight
  is_barbell   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises: read shared or own"
  on public.exercises for select using (user_id is null or auth.uid() = user_id);
create policy "exercises: write own"
  on public.exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- routines
create table if not exists public.routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.routine_exercises (
  id          uuid primary key default gen_random_uuid(),
  routine_id  uuid not null references public.routines on delete cascade,
  exercise_id uuid not null references public.exercises on delete restrict,
  position    int  not null default 0,
  target_sets int  not null default 3,
  rep_low     int  not null default 8,
  rep_high    int  not null default 12
);

alter table public.routines          enable row level security;
alter table public.routine_exercises enable row level security;

create policy "routines: own" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "routine_exercises: own" on public.routine_exercises
  for all using (
    exists (select 1 from public.routines r
            where r.id = routine_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.routines r
            where r.id = routine_id and r.user_id = auth.uid())
  );

-- ---------------------------------------------------------------- workouts
create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  routine_id   uuid references public.routines on delete set null,
  name         text,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  notes        text
);

create table if not exists public.sets (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts on delete cascade,
  exercise_id uuid not null references public.exercises on delete restrict,
  set_index   int  not null,
  weight_kg   numeric,
  reps        int,
  rpe         numeric,          -- 5.0 – 10.0, optional
  is_warmup   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.workouts enable row level security;
alter table public.sets     enable row level security;

create policy "workouts: own" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sets: own" on public.sets
  for all using (
    exists (select 1 from public.workouts w
            where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w
            where w.id = workout_id and w.user_id = auth.uid())
  );

create index if not exists sets_workout_idx   on public.sets(workout_id);
create index if not exists workouts_user_idx  on public.workouts(user_id, started_at desc);

-- ------------------------------------------------------ seed exercise library
insert into public.exercises (user_id, name, muscle_group, equipment, is_barbell) values
  (null, 'Barbell back squat',   'Quads',      'barbell',    true),
  (null, 'Barbell bench press',  'Chest',      'barbell',    true),
  (null, 'Conventional deadlift','Posterior',  'barbell',    true),
  (null, 'Overhead press',       'Shoulders',  'barbell',    true),
  (null, 'Barbell row',          'Back',       'barbell',    true),
  (null, 'Romanian deadlift',    'Hamstrings', 'barbell',    true),
  (null, 'Pull-up',              'Back',       'bodyweight', false),
  (null, 'Dip',                  'Chest',      'bodyweight', false),
  (null, 'Incline dumbbell press','Chest',     'dumbbell',   false),
  (null, 'Lateral raise',        'Shoulders',  'dumbbell',   false),
  (null, 'Leg press',            'Quads',      'machine',    false),
  (null, 'Leg curl',             'Hamstrings', 'machine',    false),
  (null, 'Lat pulldown',         'Back',       'cable',      false),
  (null, 'Cable fly',            'Chest',      'cable',      false),
  (null, 'Face pull',            'Rear delts', 'cable',      false),
  (null, 'Barbell curl',         'Biceps',     'barbell',    true),
  (null, 'Triceps pushdown',     'Triceps',    'cable',      false),
  (null, 'Standing calf raise',  'Calves',     'machine',    false)
on conflict do nothing;
