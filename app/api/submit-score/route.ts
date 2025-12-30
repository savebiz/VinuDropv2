import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { score, wallet, startTime, endTime } = await request.json();

        // Validate inputs
        if (!score || !wallet || !startTime || !endTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // --- Anti-Cheat Validation ---
        const durationSeconds = (endTime - startTime) / 1000;

        // 1. Minimum Duration Check: Impossible to score significantly in very short time
        // Reject > 5000 points if duration < 30s
        if (score > 5000 && durationSeconds < 30) {
            console.warn(`Anti-Cheat Rejection: Speed Hack. Wallet ${wallet} scored ${score} in ${durationSeconds}s`);
            return NextResponse.json({ error: 'Score rejected: Duration too short' }, { status: 403 });
        }

        // 2. Strict PPS (Points Per Second) Cap
        // Max theoretical points per merge is ~220. 
        // 500 PPS implies merging high level orbs 2+ times EVERY SECOND steadily.
        // Glitchers/Bots achieve 7k - 160k PPS.
        const MAX_PPS = 500;
        const pps = score / Math.max(durationSeconds, 1); // Avoid div by zero

        if (pps > MAX_PPS) {
            console.warn(`Anti-Cheat Rejection: PPS Limit Exceeded. Wallet ${wallet}: ${pps.toFixed(2)} PPS (${score} / ${durationSeconds}s)`);
            return NextResponse.json({ error: 'Score rejected: Suspicious activity (PPS Limit)' }, { status: 403 });
        }
        // -----------------------------

        // Use SERVICE ROLE key to bypass RLS for insertion
        const { error } = await supabase
            .from('game_scores')
            .insert([
                {
                    wallet_address: wallet,
                    score: score,
                    metadata: {
                        duration_ms: endTime - startTime,
                        verified: true
                    }
                }
            ]);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error submitting score:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
