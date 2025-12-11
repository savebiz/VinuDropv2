-- 1. RPC: Get Player Rank (Fix Crash + Partial Match)
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

    -- Find wallet if username is provided (PARTIAL MATCH SUPPORT)
    -- Priorities:
    -- 1. Exact Match (Case Insensitive)
    -- 2. Starts With
    -- 3. Shortest Length (Closest Match)
    SELECT lower(p.wallet_address) INTO target_wallet
    FROM profiles p
    WHERE lower(p.username) LIKE '%' || search_query || '%'
    ORDER BY 
        CASE WHEN lower(p.username) = search_query THEN 0 ELSE 1 END ASC,
        CASE WHEN lower(p.username) LIKE search_query || '%' THEN 0 ELSE 1 END ASC,
        length(p.username) ASC
    LIMIT 1;

    IF target_wallet IS NULL THEN
        target_wallet := search_query; -- Assume it's a wallet address
    END IF;

    -- Calculate Rank based on ALL TIME scores
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

    -- CRITICAL FIX: If target_score is NULL (user found in profiles but NO score), RETURN EMPTY
    -- This prevents the frontend from receiving a row with nulls and crashing.
    IF target_score IS NULL THEN
        RETURN;
    END IF;

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
        GREATEST(0, (thresh_score - target_score) + 1);
END;
$$;

GRANT EXECUTE ON FUNCTION get_player_rank(TEXT) TO anon, authenticated, service_role;
