-- 1. Drop existing Views
-- We use CASCADE to ensure dependent permissions are cleaned up
DROP VIEW IF EXISTS leaderboard_daily CASCADE;
DROP VIEW IF EXISTS leaderboard_weekly CASCADE;
DROP VIEW IF EXISTS leaderboard_monthly CASCADE;

-- 2. Create Standard Views (Real-time) with Fixed UTC Windows

-- Daily Leaderboard: Resets every Midnight UTC
CREATE OR REPLACE VIEW leaderboard_daily WITH (security_invoker = true) AS
SELECT
    wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
-- Filter: Created on or after the definition of "Today" in UTC
WHERE played_at >= (CURRENT_DATE AT TIME ZONE 'UTC')
GROUP BY wallet_address
ORDER BY max_score DESC;

-- Weekly Leaderboard: Resets every Sunday Midnight UTC
CREATE OR REPLACE VIEW leaderboard_weekly WITH (security_invoker = true) AS
SELECT
    wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
-- Filter: Created on or after the most recent Sunday UTC
-- extract(dow) returns 0 for Sunday. We subtract 'dow' days from current date to find last Sunday.
WHERE played_at >= (
    (CURRENT_DATE AT TIME ZONE 'UTC') - (EXTRACT(DOW FROM (CURRENT_DATE AT TIME ZONE 'UTC')) || ' days')::INTERVAL
)
GROUP BY wallet_address
ORDER BY max_score DESC;

-- Monthly Leaderboard: Resets 1st of Month Midnight UTC
CREATE OR REPLACE VIEW leaderboard_monthly WITH (security_invoker = true) AS
SELECT
    wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
-- Filter: Created on or after the 1st of the current month
WHERE played_at >= DATE_TRUNC('month', (CURRENT_DATE AT TIME ZONE 'UTC'))
GROUP BY wallet_address
ORDER BY max_score DESC;

-- 3. Grant Access
GRANT SELECT ON leaderboard_daily TO anon, authenticated, service_role;
GRANT SELECT ON leaderboard_weekly TO anon, authenticated, service_role;
GRANT SELECT ON leaderboard_monthly TO anon, authenticated, service_role;
