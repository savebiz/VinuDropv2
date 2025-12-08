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

        // Impossible to score > 0 in < 2 seconds (naive check)
        if (durationSeconds < 2 && score > 0) {
            console.warn(`Anti-Cheat Flag: Wallet ${wallet} scored ${score} in ${durationSeconds}s`);
            return NextResponse.json({ error: 'Score rejected: Duration too short' }, { status: 403 });
        }

        // More complex heuristic: ~100 points per second cap?
        // Let's be lenient for now, just filtering automated instant submissions.
        // A typical "Suika" game takes minutes for high scores.
        if (score > 1000 && durationSeconds < 10) {
            console.warn(`Anti-Cheat Flag: High score fast: ${score} in ${durationSeconds}s`);
            return NextResponse.json({ error: 'Score rejected: Suspicious activity' }, { status: 403 });
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
