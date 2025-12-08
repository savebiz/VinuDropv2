-- Fix Security Advisor Warnings
-- This makes the views respect Row Level Security (RLS) policies 
-- and clears the "Security Definer" error.

ALTER VIEW leaderboard_daily SET (security_invoker = true);
ALTER VIEW leaderboard_weekly SET (security_invoker = true);

-- Verify Access (Public read is already enabled on game_scores, so this will work)
