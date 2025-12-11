
-- Verification Script: Test Leaderboard Views

-- 1. Insert dummy scores with specific timestamps
-- Ensure we have a dummy user/wallet
INSERT INTO game_scores (wallet_address, score, played_at) VALUES 
('0xTestToday', 100, NOW()), -- Should appear in all
('0xTestYesterday', 90, NOW() - INTERVAL '2 days'), -- Should NOT be in Daily
('0xTestLastWeek', 80, NOW() - INTERVAL '8 days'), -- Should NOT be in Weekly
('0xTestLastMonth', 70, NOW() - INTERVAL '40 days'); -- Should NOT be in Monthly

-- 2. Query Daily View
SELECT * FROM leaderboard_daily WHERE wallet_address = '0xTestToday';
-- Should return 1 row.

-- 3. Query Weekly View
SELECT * FROM leaderboard_weekly WHERE wallet_address IN ('0xTestToday', '0xTestYesterday');
-- result depends on day of week, but '0xTestLastWeek' should generally be excluded if > 7 days or crossed Sunday boundary.

-- 4. Query Monthly View
SELECT * FROM leaderboard_monthly WHERE wallet_address IN ('0xTestToday', '0xTestYesterday', '0xTestLastWeek');
-- '0xTestLastMonth' should be excluded.

-- Clean up
DELETE FROM game_scores WHERE wallet_address LIKE '0xTest%';
