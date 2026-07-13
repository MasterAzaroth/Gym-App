-- IRONLOG schema v2 — additive. Safe to run on top of v1.
-- Paste into Supabase → SQL Editor → Run.

-- ------------------------------------------------- profiles: new columns
alter table public.profiles add column if not exists sex            text check (sex in ('male','female','other'));
alter table public.profiles add column if not exists birth_date     date;
alter table public.profiles add column if not exists height_cm      numeric;
alter table public.profiles add column if not exists goal           text check (goal in ('build','lean','maintain'));
alter table public.profiles add column if not exists goal_kcal      int     default 2500;
alter table public.profiles add column if not exists goal_protein_g int     default 180;
alter table public.profiles add column if not exists goal_carbs_g   int     default 280;
alter table public.profiles add column if not exists goal_fat_g     int     default 80;

-- ------------------------------------------------- routine_exercises: detail
alter table public.routine_exercises add column if not exists rest_seconds int default 120;
alter table public.routine_exercises add column if not exists notes        text;

-- ------------------------------------------------- foods
-- Macros are stored per 100 g. Every entry snapshots its own numbers, so
-- editing a food later never silently rewrites history.
create table if not exists public.foods (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade,  -- null = shared library
  name          text not null,
  brand         text,
  kcal_per_100g numeric not null,
  protein_per_100g numeric not null default 0,
  carbs_per_100g   numeric not null default 0,
  fat_per_100g     numeric not null default 0,
  serving_name  text,          -- e.g. "1 medium egg"
  serving_grams numeric,       -- e.g. 55
  created_at    timestamptz not null default now()
);

alter table public.foods enable row level security;

create policy "foods: read shared or own" on public.foods
  for select using (user_id is null or auth.uid() = user_id);
create policy "foods: write own" on public.foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------- nutrition entries
create table if not exists public.nutrition_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  food_id    uuid references public.foods on delete set null,
  entry_date date not null default current_date,
  meal       text not null default 'snack' check (meal in ('breakfast','lunch','dinner','snack')),
  name       text not null,        -- snapshot, survives food deletion
  grams      numeric not null,
  kcal       numeric not null,
  protein_g  numeric not null default 0,
  carbs_g    numeric not null default 0,
  fat_g      numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.nutrition_entries enable row level security;

create policy "nutrition: own" on public.nutrition_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists nutrition_user_date_idx
  on public.nutrition_entries(user_id, entry_date);

-- ------------------------------------------------- body metrics
create table if not exists public.body_metrics (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  measured_on  date not null default current_date,
  weight_kg    numeric,
  bodyfat_pct  numeric,
  created_at   timestamptz not null default now(),
  unique (user_id, measured_on)
);

alter table public.body_metrics enable row level security;

create policy "body_metrics: own" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------- seed food library
insert into public.foods (user_id, name, brand, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_name, serving_grams) values
  (null, 'Chicken breast, raw',    null, 120, 23.0,  0.0,  2.6, '1 breast',      170),
  (null, 'Chicken breast, cooked', null, 165, 31.0,  0.0,  3.6, '1 breast',      140),
  (null, 'Whole egg',              null, 143, 12.6,  0.7,  9.5, '1 large egg',    55),
  (null, 'Egg white',              null,  52, 10.9,  0.7,  0.2, '1 white',        33),
  (null, 'Rolled oats, dry',       null, 379, 13.2, 67.7,  6.5, '1 serving',      50),
  (null, 'White rice, cooked',     null, 130,  2.7, 28.2,  0.3, '1 cup',         158),
  (null, 'Basmati rice, dry',      null, 356,  8.5, 78.0,  0.9, '1 serving',      75),
  (null, 'Pasta, dry',             null, 371, 13.0, 74.7,  1.5, '1 serving',      80),
  (null, 'Potato, raw',            null,  77,  2.0, 17.5,  0.1, '1 medium',      170),
  (null, 'Sweet potato, raw',      null,  86,  1.6, 20.1,  0.1, '1 medium',      130),
  (null, 'Whole wheat bread',      null, 247, 13.0, 41.0,  3.4, '1 slice',        35),
  (null, 'Skyr, plain',            null,  63, 11.0,  4.0,  0.2, '1 pot',         150),
  (null, 'Greek yoghurt 2%',       null,  73, 10.0,  3.6,  1.9, '1 pot',         170),
  (null, 'Quark, low fat',         null,  67, 12.0,  4.1,  0.3, '1 pot',         250),
  (null, 'Whey protein powder',    null, 380, 78.0,  8.0,  5.0, '1 scoop',        30),
  (null, 'Milk, 1.5%',             null,  47,  3.4,  4.8,  1.5, '1 glass',       250),
  (null, 'Beef mince, 5% fat',     null, 137, 21.0,  0.0,  5.0, '1 portion',     150),
  (null, 'Salmon fillet',          null, 208, 20.4,  0.0, 13.4, '1 fillet',      130),
  (null, 'Tuna in water, drained', null, 116, 26.0,  0.0,  1.0, '1 tin',          95),
  (null, 'Tofu, firm',             null, 144, 17.3,  2.8,  8.7, '1 block',       200),
  (null, 'Olive oil',              null, 884,  0.0,  0.0,100.0, '1 tbsp',         14),
  (null, 'Peanut butter',          null, 588, 25.1, 19.6, 50.4, '1 tbsp',         16),
  (null, 'Almonds',                null, 579, 21.2, 21.6, 49.9, '1 handful',      28),
  (null, 'Avocado',                null, 160,  2.0,  8.5, 14.7, '1/2 avocado',   100),
  (null, 'Banana',                 null,  89,  1.1, 22.8,  0.3, '1 medium',      120),
  (null, 'Apple',                  null,  52,  0.3, 13.8,  0.2, '1 medium',      180),
  (null, 'Blueberries',            null,  57,  0.7, 14.5,  0.3, '1 handful',      75),
  (null, 'Broccoli, raw',          null,  34,  2.8,  6.6,  0.4, '1 portion',     150),
  (null, 'Spinach, raw',           null,  23,  2.9,  3.6,  0.4, '1 portion',     100),
  (null, 'Cheddar cheese',         null, 402, 25.0,  1.3, 33.0, '1 slice',        25),
  (null, 'Cottage cheese',         null,  98, 11.1,  3.4,  4.3, '1 pot',         200),
  (null, 'Lentils, cooked',        null, 116,  9.0, 20.1,  0.4, '1 portion',     150),
  (null, 'Black beans, cooked',    null, 132,  8.9, 23.7,  0.5, '1 portion',     150),
  (null, 'Dark chocolate 85%',     null, 592,  9.8, 22.0, 46.0, '2 squares',      20)
on conflict do nothing;
