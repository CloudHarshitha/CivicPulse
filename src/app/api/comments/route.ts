import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const issue_id = searchParams.get('issue_id');

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id parameter required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(full_name, avatar_url, role)')
      .eq('issue_id', issue_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comments';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { issue_id, content, photo_url } = body;

    if (!issue_id || !content?.trim()) {
      return NextResponse.json({ error: 'issue_id and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        issue_id,
        user_id: user.id,
        content,
        photo_url: photo_url || null,
      })
      .select('*, user:profiles(full_name, avatar_url, role)')
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to post comment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
