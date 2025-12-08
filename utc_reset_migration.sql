-- UTC Reset Migration - Fixed Daily Rewards

-- 1. Create the daily_rewards table
CREATE TABLE IF NOT EXISTS public.daily_rewards (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    streak_count INTEGER NOT NULL DEFAULT 1,
    -- Generated column to index claims by date, optimizing "Already Claimed" checks
    last_claim_date DATE GENERATED ALWAYS AS (last_claimed_at AT TIME ZONE 'UTC') STORED
);

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_rewards_claim_date ON public.daily_rewards (user_id, last_claim_date);

-- 3. Enable RLS
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow users to view their own rewards
CREATE POLICY "Users can view own reward status" 
ON public.daily_rewards FOR SELECT 
USING (auth.uid() = user_id);

-- Deny direct inserts/updates (Must use RPC)
CREATE POLICY "Users cannot directly modify rewards" 
ON public.daily_rewards FOR INSERT WITH CHECK (false);

CREATE POLICY "Users cannot directly update rewards" 
ON public.daily_rewards FOR UPDATE USING (false);

-- 5. The Atomic Claim Function (RPC)
CREATE OR REPLACE FUNCTION claim_daily_reward()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (bypass RLS for update)
SET search_path = public, auth
AS $$
DECLARE
    target_user_id UUID;
    record_claim_time TIMESTAMPTZ;
    record_claim_date DATE;
    current_utc_date DATE;
    new_streak INTEGER;
BEGIN
    -- A. Identify User
    target_user_id := auth.uid();
    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not Authenticated');
    END IF;

    -- B. Calculate "Today" in UTC
    current_utc_date := (NOW() AT TIME ZONE 'UTC')::DATE;

    -- C. Lock and Retrieve current status
    -- "FOR UPDATE" serializes access for this user to prevent race conditions
    SELECT last_claimed_at, streak_count
    INTO record_claim_time, new_streak
    FROM public.daily_rewards
    WHERE user_id = target_user_id
    FOR UPDATE;

    -- D. Validation Logic
    IF record_claim_time IS NOT NULL THEN
        -- Convert stored timestamp to UTC Date
        record_claim_date := (record_claim_time AT TIME ZONE 'UTC')::DATE;

        -- Scenario 1: Already claimed today
        IF record_claim_date = current_utc_date THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Already claimed today',
                'next_reset', (current_utc_date + 1) -- Tomorrow
            );
        END IF;

        -- Scenario 2: Streak Logic
        -- If last claim was yesterday (today - 1), increment streak.
        -- Otherwise (missed a day), reset to 1.
        IF record_claim_date = (current_utc_date - 1) THEN
            new_streak := new_streak + 1;
        ELSE
            new_streak := 1;
        END IF;
    ELSE
        -- Scenario 3: First time ever claiming
        new_streak := 1;
    END IF;

    -- E. Execution
    INSERT INTO public.daily_rewards (user_id, last_claimed_at, streak_count)
    VALUES (target_user_id, NOW(), new_streak)
    ON CONFLICT (user_id)
    DO UPDATE SET
        last_claimed_at = EXCLUDED.last_claimed_at,
        streak_count = EXCLUDED.streak_count;

    -- F. Return Success
    RETURN jsonb_build_object(
        'success', true,
        'new_streak', new_streak,
        'timestamp', NOW()
    );
END;
$$;
