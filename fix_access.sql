-- Fix Access Permissions
-- This script explicitly grants access to the "anon" (public) role.
-- Sometimes RLS is enabled, but the basic "SELECT" permission is missing.

-- 1. Grant usage on schema (standard)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant access to the underlying table
GRANT SELECT, INSERT ON TABLE game_scores TO anon, authenticated, service_role;

-- 3. Grant access to the Leaderboard Views
GRANT SELECT ON TABLE leaderboard_daily TO anon, authenticated, service_role;
GRANT SELECT ON TABLE leaderboard_weekly TO anon, authenticated, service_role;

-- 4. Ensure RLS Policy allows reading (Redundant but safe)
DROP POLICY IF EXISTS "Public read access" ON game_scores;
CREATE POLICY "Public read access" ON game_scores FOR SELECT TO public USING (true);
