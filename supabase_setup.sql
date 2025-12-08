-- Create game_scores table
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Enable RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Public read
CREATE POLICY "Public read access" ON game_scores FOR SELECT USING (true);

-- Policy: Service role only insert (via API)
CREATE POLICY "Service role insert" ON game_scores FOR INSERT TO service_role WITH CHECK (true);

-- Materialized View: Daily Leaderboard
CREATE MATERIALIZED VIEW leaderboard_daily AS
SELECT
    wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY wallet_address
ORDER BY max_score DESC;

-- Materialized View: Weekly Leaderboard
CREATE MATERIALIZED VIEW leaderboard_weekly AS
SELECT
    wallet_address,
    MAX(score) as max_score,
    RANK() OVER (ORDER BY MAX(score) DESC) as rank
FROM game_scores
WHERE created_at > NOW() - INTERVAL '1 week'
GROUP BY wallet_address
ORDER BY max_score DESC;

-- Function to refresh views (can be called via cron)
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly;
END;
$$ LANGUAGE plpgsql;
