-- 1. Drop obsolete function
-- Since we converted to Standard Views, we no longer need to "refresh" them.
-- In fact, this function would fail now because the materialized views are gone.
DROP FUNCTION IF EXISTS refresh_leaderboards();

-- 2. Fix "Search Path Mutable" Warning
-- This locks the function to only look in the 'public' schema, preventing search_path hijacking.
-- Assumes get_player_rank takes a TEXT argument (wallet address).
ALTER FUNCTION get_player_rank(TEXT) SET search_path = public;
