-- Update get_leaderboard to use STRICT UTC Truncation for standardized resets.
-- This ensures the leaderboard resets exactly at 00:00 UTC, regardless of server timezone.

DROP FUNCTION IF EXISTS get_leaderboard(text);

CREATE OR REPLACE FUNCTION get_leaderboard(period text)
RETURNS TABLE (
    wallet_address text,
    username text,
    max_score bigint,
    rank bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
Set search_path = public
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
                    gs.played_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
                WHEN period = 'weekly' THEN 
                    gs.played_at >= date_trunc('week', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
                WHEN period = 'monthly' THEN 
                    gs.played_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
                WHEN period = 'yearly' THEN 
                    gs.played_at >= date_trunc('year', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
                ELSE TRUE -- All Time
            END
    )
    SELECT 
        rs.wallet_address,
        rs.username,
        rs.score::bigint as max_score,
        RANK() OVER (ORDER BY rs.score DESC) as rank
    FROM ranked_scores rs
    WHERE rs.personal_rank = 1
    ORDER BY rs.score DESC
    LIMIT 100;
END;
$$;
