-- FIX Leaderboard Grouping
-- Consolidates mixed-case wallet addresses into single entries.

-- 1. Redefine Daily View
CREATE OR REPLACE VIEW leaderboard_daily AS
SELECT
    LOWER(wallet_address) as wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY LOWER(wallet_address)
ORDER BY max_score DESC;

-- 2. Redefine Weekly View
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
    LOWER(wallet_address) as wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
WHERE created_at > NOW() - INTERVAL '1 week'
GROUP BY LOWER(wallet_address)
ORDER BY max_score DESC;

-- 3. Ensure Security Invoker is still ON (Standard Request)
ALTER VIEW leaderboard_daily SET (security_invoker = true);
ALTER VIEW leaderboard_weekly SET (security_invoker = true);

-- 4. Grant Permissions (Safety)
GRANT SELECT ON leaderboard_daily TO anon, authenticated, service_role;
GRANT SELECT ON leaderboard_weekly TO anon, authenticated, service_role;
