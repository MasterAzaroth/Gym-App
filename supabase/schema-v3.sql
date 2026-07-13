-- ============================================================================
-- IRONLOG schema v3 — per-set targets in routines.
--
-- Until now a routine exercise carried one rep range for all its sets. Real
-- programming doesn't work that way: a heavy top set and three back-offs are
-- different prescriptions. So a planned set becomes its own row.
--
-- Additive and idempotent. Existing routines are backfilled automatically —
-- "4 sets of 6–10" becomes four rows of 6–10, so nothing is lost.
-- Run AFTER schema.sql and schema-v2.sql.
-- ============================================================================

create table if not exists public.routine_sets (
  id                  uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid not null references public.routine_exercises on delete cascade,
  set_index           int  not null default 0,
  rep_low             int  not null default 8,
  rep_high            int  not null default 12,
  rest_seconds        int  not null default 120,
  is_warmup           boolean not null default false,
  target_weight_kg    numeric,          -- optional; null means "work it out on the day"
  created_at          timestamptz not null default now()
);

alter table public.routine_sets enable row level security;

-- Ownership walks routine_sets → routine_exercises → routines → user.
drop policy if exists "routine_sets: own" on public.routine_sets;
create policy "routine_sets: own" on public.routine_sets
  for all using (
    exists (
      select 1
      from public.routine_exercises re
      join public.routines r on r.id = re.routine_id
      where re.id = routine_exercise_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.routine_exercises re
      join public.routines r on r.id = re.routine_id
      where re.id = routine_exercise_id and r.user_id = auth.uid()
    )
  );

create index if not exists routine_sets_parent_idx
  on public.routine_sets(routine_exercise_id, set_index);

-- ---------------------------------------------------------------- backfill
-- Expand every existing routine_exercise into one row per planned set.
-- Skips any exercise that already has rows, so re-running is harmless.
insert into public.routine_sets
  (routine_exercise_id, set_index, rep_low, rep_high, rest_seconds)
select
  re.id,
  g.i,
  coalesce(re.rep_low, 8),
  coalesce(re.rep_high, 12),
  coalesce(re.rest_seconds, 120)
from public.routine_exercises re
cross join lateral generate_series(0, greatest(coalesce(re.target_sets, 3), 1) - 1) as g(i)
where not exists (
  select 1 from public.routine_sets rs where rs.routine_exercise_id = re.id
);

-- The old columns stay on routine_exercises so nothing breaks mid-deploy, but
-- the app no longer reads rep_low / rep_high / target_sets. routine_sets is the
-- source of truth from here.
comment on column public.routine_exercises.target_sets is 'Deprecated — see routine_sets.';
comment on column public.routine_exercises.rep_low    is 'Deprecated — see routine_sets.';
comment on column public.routine_exercises.rep_high   is 'Deprecated — see routine_sets.';
