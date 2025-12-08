import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"; // Anon key is fine for reading public views
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'daily';

        let viewName = 'leaderboard_daily';
        if (period === 'weekly') viewName = 'leaderboard_weekly';
        if (period === 'monthly') viewName = 'leaderboard_monthly';
        if (period === 'all_time') viewName = 'leaderboard_all_time';

        const { data, error } = await supabase
            .from(viewName)
            .select('*')
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
