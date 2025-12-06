-- FIX Daily Rewards: Switch from Auth UID to Wallet Address
-- Allows users connected via Thirdweb (without Supabase Auth) to claim rewards.

-- 1. Drop old logic
DROP FUNCTION IF EXISTS claim_daily_reward();
DROP POLICY IF EXISTS "Users can view own reward status" ON public.daily_rewards;
DROP TABLE IF EXISTS public.daily_rewards;

-- 2. Create new table (Wallet Based)
CREATE TABLE IF NOT EXISTS public.daily_rewards (
    wallet_address TEXT PRIMARY KEY,
    last_claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    streak_count INTEGER NOT NULL DEFAULT 1,
    last_claim_date DATE GENERATED ALWAYS AS (last_claimed_at AT TIME ZONE 'UTC') STORED
);

-- 3. Enable RLS (Public)
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rewards" 
ON public.daily_rewards FOR SELECT 
USING (true);

-- 4. New RPC Function (Accepts Wallet Address)
CREATE OR REPLACE FUNCTION claim_daily_reward(target_wallet TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    record_claim_time TIMESTAMPTZ;
    record_claim_date DATE;
    current_utc_date DATE;
    new_streak INTEGER;
BEGIN
    -- Validation
    IF target_wallet IS NULL OR target_wallet = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet address required');
    END IF;

    -- Normalize
    target_wallet := LOWER(target_wallet);

    -- Calculate Today UTC
    current_utc_date := (NOW() AT TIME ZONE 'UTC')::DATE;

    -- Lock & Fetch
    SELECT last_claimed_at, streak_count
    INTO record_claim_time, new_streak
    FROM public.daily_rewards
    WHERE wallet_address = target_wallet
    FOR UPDATE;

    -- Logic
    IF record_claim_time IS NOT NULL THEN
        record_claim_date := (record_claim_time AT TIME ZONE 'UTC')::DATE;

        -- Already claimed today?
        IF record_claim_date = current_utc_date THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Already claimed today',
                'next_reset', (current_utc_date + 1)
            );
        END IF;

        -- Streak Check (Claimed Yesterday?)
        IF record_claim_date = (current_utc_date - 1) THEN
            new_streak := new_streak + 1;
        ELSE
            new_streak := 1;
        END IF;
    ELSE
        -- First time
        new_streak := 1;
    END IF;

    -- Upsert
    INSERT INTO public.daily_rewards (wallet_address, last_claimed_at, streak_count)
    VALUES (target_wallet, NOW(), new_streak)
    ON CONFLICT (wallet_address)
    DO UPDATE SET
        last_claimed_at = EXCLUDED.last_claimed_at,
        streak_count = EXCLUDED.streak_count;

    RETURN jsonb_build_object(
        'success', true,
        'new_streak', new_streak,
        'timestamp', NOW()
    );
END;
$$;
