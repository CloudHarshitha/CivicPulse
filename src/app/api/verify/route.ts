import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateDistance } from '@/lib/geo';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user is authority
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['authority', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Unauthorized - Authority access required' }, { status: 403 });
    }

    const body = await request.json();
    const { issue_id, resolution_photo_url, resolution_latitude, resolution_longitude, resolution_notes } = body;

    if (!issue_id || !resolution_photo_url || !resolution_latitude || !resolution_longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the original issue for GPS audit
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('latitude, longitude, reporter_id')
      .eq('id', issue_id)
      .single();

    if (issueError || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // GPS Audit: Compare before/after coordinates (must be within 15 meters)
    const distance = calculateDistance(
      issue.latitude, issue.longitude,
      resolution_latitude, resolution_longitude
    );
    const gpsAuditPassed = distance <= 15;

    // Create resolution record
    const verificationDeadline = new Date();
    verificationDeadline.setHours(verificationDeadline.getHours() + 48);

    const { data: resolution, error: resError } = await supabase
      .from('resolutions')
      .insert({
        issue_id,
        resolved_by: user.id,
        resolution_photo_url,
        resolution_latitude,
        resolution_longitude,
        resolution_notes: resolution_notes || '',
        gps_audit_passed: gpsAuditPassed,
        gps_distance_meters: Math.round(distance * 100) / 100,
        verification_deadline: verificationDeadline.toISOString(),
      })
      .select()
      .single();

    if (resError) throw resError;

    // Update issue status to resolved
    await supabase
      .from('issues')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', issue_id);

    // Create notification for reporter
    await supabase.from('notifications').insert({
      user_id: issue.reporter_id,
      title: 'Issue Resolved',
      message: 'Your reported issue has been resolved. Please verify the resolution within 48 hours.',
      type: 'resolution',
      issue_id,
    });

    // Add resolution photo to issue_photos
    await supabase.from('issue_photos').insert({
      issue_id,
      photo_url: resolution_photo_url,
      photo_type: 'after',
      latitude: resolution_latitude,
      longitude: resolution_longitude,
      captured_at: new Date().toISOString(),
    });

    return NextResponse.json({
      data: resolution,
      gps_audit: {
        passed: gpsAuditPassed,
        distance_meters: Math.round(distance * 100) / 100,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Citizen verification endpoint
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { issue_id, accepted, feedback } = body;

    // Get the issue to verify reporter
    const { data: issue } = await supabase
      .from('issues')
      .select('reporter_id')
      .eq('id', issue_id)
      .single();

    if (!issue || issue.reporter_id !== user.id) {
      return NextResponse.json({ error: 'Only the original reporter can verify' }, { status: 403 });
    }

    if (accepted) {
      // Mark as verified
      await supabase.from('resolutions')
        .update({
          citizen_verified: true,
          citizen_feedback: feedback || '',
          verified_at: new Date().toISOString(),
        })
        .eq('issue_id', issue_id);

      await supabase.from('issues')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', issue_id);
    } else {
      // Reopen the issue
      await supabase.from('resolutions')
        .update({
          citizen_verified: false,
          citizen_feedback: feedback || '',
        })
        .eq('issue_id', issue_id);

      await supabase.from('issues')
        .update({
          status: 'open',
          resolved_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issue_id);
    }

    return NextResponse.json({ success: true, status: accepted ? 'verified' : 'reopened' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
