const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Missing Supabase Environment Variables.");
    console.log("URL:", supabaseUrl ? "Found" : "Missing");
    console.log("KEY:", supabaseKey ? "Found" : "Missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeaderboard() {
    console.log("🔍 Probing 'get_leaderboard' RPC...");
    console.log("   URL:", supabaseUrl);

    // Test 1: Daily
    console.log("\n--- Testing 'daily' ---");
    const { data: dailyData, error: dailyError } = await supabase.rpc('get_leaderboard', { period: 'daily' });

    if (dailyError) {
        console.error("❌ Error fetching daily:", dailyError);
    } else {
        console.log(`✅ Success! Found ${dailyData?.length || 0} scores.`);
        if (dailyData?.length > 0) {
            console.log("   Top score:", dailyData[0]);
        } else {
            console.log("   Warning: result is empty array []");
        }
    }

    // Test 2: All Time (pass null or handle explicitly if your function supports it, or just use 'yearly' as proxy)
    console.log("\n--- Testing 'yearly' ---");
    const { data: yearlyData, error: yearlyError } = await supabase.rpc('get_leaderboard', { period: 'yearly' });

    if (yearlyError) {
        console.error("❌ Error fetching yearly:", yearlyError);
    } else {
        console.log(`✅ Success! Found ${yearlyData?.length || 0} scores.`);
        if (yearlyData?.length > 0) {
            console.log("   Top score:", yearlyData[0]);
        }
    }
}

testLeaderboard();
