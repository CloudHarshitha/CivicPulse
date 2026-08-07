import { createClient } from '@supabase/supabase-js';

/**
 * Service role Supabase client for admin operations that require bypassing Row Level Security (RLS)
 * e.g., AI triage background processing, SLA escalation workers, system notifications.
 * DO NOT expose this client to the browser.
 */
export function createAdminClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  
  if (supabaseUrl) {
    supabaseUrl = supabaseUrl.trim();
    if (!supabaseUrl.includes('.') && !supabaseUrl.includes('localhost')) {
      supabaseUrl = `${supabaseUrl}.supabase.co`;
    }
    if (!supabaseUrl.startsWith('http')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }
  }

  return createClient(supabaseUrl, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
