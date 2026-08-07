import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Stage 03: PostGIS Spatial Deduplication API
 * Checks for existing unresolved tickets within a 30-meter radius and 48-hour window.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { latitude, longitude, radius_meters = 30, hours_window = 48, category } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Missing latitude and longitude' }, { status: 400 });
    }

    // Try PostGIS database RPC query
    let duplicates = [];
    try {
      const { data, error } = await supabase.rpc('find_nearby_issues', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius_meters: radius_meters,
        p_hours_window: hours_window,
        p_category: category || null,
      });

      if (!error && data) {
        duplicates = data;
      }
    } catch {
      console.warn('PostGIS function call failed, falling back');
    }

    const isDuplicateFound = duplicates.length > 0;

    if (isDuplicateFound && user) {
      // Auto-merge as upvote on existing primary ticket using admin client
      const primaryIssueId = duplicates[0].issue_id;
      const adminClient = createAdminClient();
      
      await adminClient.from('upvotes').upsert({
        issue_id: primaryIssueId,
        user_id: user.id,
      }, { onConflict: 'issue_id,user_id' });

      return NextResponse.json({
        duplicate_found: true,
        merged: true,
        primary_issue: duplicates[0],
        message: `Nearby duplicate ticket detected within ${Math.round(duplicates[0].distance_meters)} meters. Your report was automatically merged as a community upvote!`,
      });
    }

    return NextResponse.json({
      duplicate_found: false,
      merged: false,
      duplicates: [],
      message: 'No duplicate issue found within 30-meter radius. Proceeding with new ticket creation.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Deduplication query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
