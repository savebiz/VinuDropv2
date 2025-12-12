-- 1. Game Scores Table
-- DROP to ensure clean slate and avoid column mismatch (e.g. created_at vs played_at)
DROP TABLE IF EXISTS game_scores CASCADE;

CREATE TABLE IF NOT EXISTS game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    score INTEGER NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- Stores proof/replay data
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_game_scores_wallet ON game_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_played_at ON game_scores(played_at);

-- 2. Enable RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Allow INSERT only via Service Role (API Route)
CREATE POLICY "Service Role can insert scores" 
ON game_scores FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Allow READ by everyone (Public Leaderboard)
CREATE POLICY "Public can read scores" 
ON game_scores FOR SELECT 
TO anon, authenticated, service_role 
USING (true);


-- 3. RPC: Get Leaderboard
-- Drop first to allow return type changes
DROP FUNCTION IF EXISTS get_leaderboard(TEXT);

-- Returns Top 50 unique players for a specific period
CREATE OR REPLACE FUNCTION get_leaderboard(period TEXT)
RETURNS TABLE (
    wallet_address TEXT,
    username TEXT,
    max_score INTEGER,
    rank BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
BEGIN
    -- Determine time window
    RETURN QUERY
    WITH RankedScores AS (
        SELECT 
            lower(gs.wallet_address) as w_addr,
            MAX(gs.score) as score
        FROM game_scores gs
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
        GROUP BY lower(gs.wallet_address)
    ),
    FinalRank as (
        SELECT 
            rs.w_addr,
            p.username,
            rs.score,
            RANK() OVER (ORDER BY rs.score DESC) as rnk
        FROM RankedScores rs
        LEFT JOIN profiles p ON lower(p.wallet_address) = rs.w_addr -- Join with profiles
    )
    SELECT 
        fr.w_addr,
        fr.username,
        fr.score,
        fr.rnk
    FROM FinalRank fr
    ORDER BY fr.rnk ASC
    LIMIT 50;
END;
$$;


-- 4. RPC: Get Player Rank
-- Drop first to allow return type changes
DROP FUNCTION IF EXISTS get_player_rank(TEXT);

-- Finds the specific rank of a player (wallet or username)
CREATE OR REPLACE FUNCTION get_player_rank(search_query TEXT)
RETURNS TABLE (
    wallet_address TEXT,
    username TEXT,
    max_score INTEGER,
    rank BIGINT,
    points_to_top_30 INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_wallet TEXT;
    target_rank BIGINT;
    target_score INTEGER;
    thresh_score INTEGER; -- Score of rank 30
BEGIN
    -- Normalize search query
    search_query := lower(trim(search_query));

    -- Find wallet if username is provided, or assume it's a wallet
    SELECT lower(p.wallet_address) INTO target_wallet
    FROM profiles p
    WHERE lower(p.username) = search_query;

    IF target_wallet IS NULL THEN
        target_wallet := search_query; -- Assume it's a wallet address
    END IF;

    -- Calculate Rank based on ALL TIME scores (simplification for "Global Rank")
    -- Can easily be adapted to periods if needed, but usually search is global.
    
    WITH UserMax AS (
         SELECT 
            lower(gs.wallet_address) as w_addr,
            MAX(gs.score) as score
        FROM game_scores gs
        GROUP BY lower(gs.wallet_address)
    ),
    RankedUsers AS (
        SELECT 
            um.w_addr,
            um.score,
            RANK() OVER (ORDER BY um.score DESC) as rnk
        FROM UserMax um
    )
    SELECT
        ru.w_addr,
        p.username,
        ru.score,
        ru.rnk
    INTO
        target_wallet,
        username,
        target_score,
        target_rank
    FROM RankedUsers ru
    LEFT JOIN profiles p ON lower(p.wallet_address) = ru.w_addr
    WHERE ru.w_addr = target_wallet;

    -- Get Score of Rank 30
    SELECT score INTO thresh_score
    FROM (
        SELECT MAX(gs.score) as score FROM game_scores gs GROUP BY lower(gs.wallet_address) ORDER BY score DESC LIMIT 1 OFFSET 29
    ) sub;
    
    IF thresh_score IS NULL THEN thresh_score := 0; END IF;

    RETURN QUERY SELECT
        target_wallet,
        username,
        target_score,
        target_rank,
        GREATEST(0, (thresh_score - target_score) + 1); -- Points needed to beat rank 30
END;
$$;

-- Grant access to RPCs
GRANT EXECUTE ON FUNCTION get_leaderboard(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_player_rank(TEXT) TO anon, authenticated, service_role;
