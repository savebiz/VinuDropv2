-- Update get_leaderboard to use STRICT UTC Truncation for standardized resets.
-- This ensures the leaderboard resets exactly at 00:00 UTC, regardless of server timezone.

CREATE OR REPLACE FUNCTION get_leaderboard(period text)
RETURNS TABLE (
    wallet_address text,
    username text,
    max_score bigint,
    rank bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_scores AS (
        SELECT 
            gs.wallet_address,
            COALESCE(p.username, 'Anonymous') as username,
            gs.score,
            ROW_NUMBER() OVER (PARTITION BY gs.wallet_address ORDER BY gs.score DESC) as personal_rank
        FROM game_scores gs
        LEFT JOIN profiles p ON gs.wallet_address = p.wallet_address
        WHERE 
            CASE 
                WHEN period = 'daily' THEN 
                    gs.created_at >= date_trunc('day', now() at time zone 'utc')
                WHEN period = 'weekly' THEN 
                    gs.created_at >= date_trunc('week', now() at time zone 'utc')
                WHEN period = 'monthly' THEN 
                    gs.created_at >= date_trunc('month', now() at time zone 'utc')
                WHEN period = 'yearly' THEN 
                    gs.created_at >= date_trunc('year', now() at time zone 'utc')
                ELSE TRUE -- All Time
            END
    )
    SELECT 
        rs.wallet_address,
        rs.username,
        rs.score as max_score,
        RANK() OVER (ORDER BY rs.score DESC) as rank
    FROM ranked_scores rs
    WHERE rs.personal_rank = 1
    ORDER BY rs.score DESC
    LIMIT 100;
END;
$$;
