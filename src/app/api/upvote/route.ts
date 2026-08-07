import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { issue_id } = await request.json();
    if (!issue_id) return NextResponse.json({ error: 'Missing issue_id' }, { status: 400 });

    // Toggle upvote
    const { data: existing } = await supabase
      .from('upvotes')
      .select('id')
      .eq('issue_id', issue_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Remove upvote
      await supabase.from('upvotes').delete().eq('id', existing.id);
      return NextResponse.json({ upvoted: false });
    } else {
      // Add upvote
      await supabase.from('upvotes').insert({ issue_id, user_id: user.id });
      return NextResponse.json({ upvoted: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
