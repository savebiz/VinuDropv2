-- 1. Drop existing Materialized Views
DROP MATERIALIZED VIEW IF EXISTS leaderboard_daily;
DROP MATERIALIZED VIEW IF EXISTS leaderboard_weekly;

-- 2. Create Standard Views (Real-time)
-- Daily Leaderboard
CREATE OR REPLACE VIEW leaderboard_daily AS
SELECT
    wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY wallet_address
ORDER BY max_score DESC;

-- Weekly Leaderboard
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
    wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
WHERE created_at > NOW() - INTERVAL '1 week'
GROUP BY wallet_address
ORDER BY max_score DESC;

-- 3. Grant Access (just in case)
GRANT SELECT ON leaderboard_daily TO anon, authenticated, service_role;
GRANT SELECT ON leaderboard_weekly TO anon, authenticated, service_role;
