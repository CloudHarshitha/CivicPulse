import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSeverityWeight } from '@/lib/scoring';
import { getSLADeadline } from '@/lib/sla';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5000';

    // Use PostGIS function for radius-based feed
    if (lat && lng) {
      const { data, error } = await supabase.rpc('get_locality_feed', {
        p_latitude: parseFloat(lat),
        p_longitude: parseFloat(lng),
        p_radius_meters: parseFloat(radius),
        p_category: category || null,
        p_priority: priority || null,
        p_status: status || null,
        p_sort_by: sortBy,
        p_limit: limit,
        p_offset: offset,
        p_city: city || null,
        p_district: district || null,
      });
      if (error) throw error;
      return NextResponse.json({ data, count: data?.length || 0 });
    }

    // Ward-based feed (hierarchical match)
    let query = supabase
      .from('issues')
      .select('*, reporter:profiles!reporter_id(full_name, avatar_url)', { count: 'exact' })
      .neq('status', 'rejected');

    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);
    if (status) query = query.eq('status', status);
    if (city) query = query.eq('city', city);
    if (district) query = query.eq('district', district);

    switch (sortBy) {
      case 'priority': query = query.order('action_priority_score', { ascending: false }); break;
      case 'upvotes': query = query.order('upvote_count', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, category, priority, latitude, longitude, address, photo_url, city, district, state, ward } = body;

    if (!title || !category || !priority || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const severityWeight = getSeverityWeight(priority);
    const slaDeadline = getSLADeadline(priority, category, new Date().toISOString());

    // Check for duplicates within 30m radius, 48h window
    const { data: duplicates } = await supabase.rpc('find_nearby_issues', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_meters: 30,
      p_hours_window: 48,
      p_category: category,
    });

    if (duplicates && duplicates.length > 0) {
      // Auto-merge as upvote on existing ticket
      const existingIssueId = duplicates[0].issue_id;
      await supabase.from('upvotes').upsert({
        issue_id: existingIssueId,
        user_id: user.id,
      });
      return NextResponse.json({
        merged: true,
        existing_issue_id: existingIssueId,
        message: 'A similar issue was found nearby. Your report has been merged as an upvote.',
      });
    }

    const { data, error } = await supabase.from('issues').insert({
      reporter_id: user.id,
      title, description, category, priority,
      latitude, longitude, address, photo_url,
      city, district, state, ward,
      severity_weight: severityWeight,
      action_priority_score: severityWeight,
      sla_deadline: slaDeadline.toISOString(),
      status: 'open',
    }).select().single();

    if (error) throw error;

    // Create photo record
    if (photo_url) {
      await supabase.from('issue_photos').insert({
        issue_id: data.id,
        photo_url,
        photo_type: 'before',
        latitude, longitude,
        captured_at: body.photo_timestamp || new Date().toISOString(),
      });
    }

    return NextResponse.json({ data, merged: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
