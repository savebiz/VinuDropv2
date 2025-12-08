import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { score, wallet, proof } = await request.json();

        // Validate inputs
        if (!score || !wallet) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // TODO: Validate proof (Time vs Score check)
        // For now, we'll just insert

        const { error } = await supabase
            .from('game_scores')
            .insert([
                { wallet_address: wallet, score: score, metadata: { proof } }
            ]);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error submitting score:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
