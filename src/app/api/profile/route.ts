import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Whitelist all allowed profile fields
    const allowedFields = [
      'full_name', 'phone', 'state', 'district', 'city', 'ward',
      'avatar_url', 'latitude', 'longitude',
      'aadhaar_number', 'is_verified', 'aadhaar_last_four',
      'aadhaar_verified_at', 'verification_ref_id',
      'kyc_provider', 'digilocker_doc_id',
      'notif_ticket_updates', 'notif_upvotes', 'notif_sla_warnings',
    ];

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Upsert: try update first, if no row matched then insert
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // No row found — insert instead
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: user.id, email: user.email, ...updates }])
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json({ data: inserted, message: 'Profile created successfully' });
    }

    if (updateError) throw updateError;

    return NextResponse.json({ data: updated, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
