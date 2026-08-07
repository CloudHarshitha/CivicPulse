import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');

    let query = supabase.from('departments').select('*');

    if (category) query = query.eq('category', category);
    if (city) query = query.eq('city', city);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch departments';
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

    // Verify authority/admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['authority', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Authority access required' }, { status: 403 });
    }

    const body = await request.json();
    const { issue_id, department_id, contractor_name, contractor_phone, notes } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id is required' }, { status: 400 });
    }

    // Create assignment record
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .insert({
        issue_id,
        department_id,
        assigned_by: user.id,
        contractor_name,
        contractor_phone,
        notes,
      })
      .select()
      .single();

    if (assignError) throw assignError;

    // Update issue status to in_progress and set assigned department
    await supabase
      .from('issues')
      .update({
        status: 'in_progress',
        assigned_department: department_id ? (await supabase.from('departments').select('name').eq('id', department_id).single()).data?.name : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', issue_id);

    return NextResponse.json({ data: assignment, message: 'Ticket assigned and status set to in_progress' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Assignment failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
