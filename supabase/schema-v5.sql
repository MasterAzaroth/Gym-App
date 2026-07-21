-- ============================================================================
-- IRONLOG schema v5 — target RIR (reps in reserve) per planned set.
--
-- Rep range and rest time say what to do; RIR says how hard to make it feel —
-- a top set planned to 0-1 RIR is a different instruction from back-offs left
-- at 3-4. Optional: null means "not specified", same convention as
-- target_weight_kg.
--
-- Additive and idempotent. Run after schema.sql, schema-v2.sql, schema-v3.sql,
-- schema-v4.sql.
-- ============================================================================

alter table public.routine_sets add column if not exists target_rir numeric;
