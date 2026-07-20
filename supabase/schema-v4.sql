-- ============================================================================
-- IRONLOG schema v4 — time-based nutrition log.
--
-- Meals used to be bucketed into fixed breakfast/lunch/dinner/snack sections.
-- Now every entry carries the clock time it was eaten, and the food log
-- renders as one chronological list instead. Each user's "day" also gets a
-- configurable start/end (defaulting to 06:00–23:59), set from Profile →
-- Nutrition goals, which bounds the time picker when logging.
--
-- Additive and idempotent. Run after schema.sql, schema-v2.sql, schema-v3.sql.
-- ============================================================================

alter table public.profiles add column if not exists day_start_time time not null default '06:00';
alter table public.profiles add column if not exists day_end_time   time not null default '23:59';

alter table public.nutrition_entries add column if not exists logged_time time not null default current_time;

create index if not exists nutrition_user_date_time_idx
  on public.nutrition_entries(user_id, entry_date, logged_time);

-- meal stays on the table (existing rows keep their value, and the column's
-- own default keeps new inserts happy) but the app no longer reads it.
comment on column public.nutrition_entries.meal is 'Deprecated — see logged_time.';
