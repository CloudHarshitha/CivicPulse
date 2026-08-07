import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  if (url) {
    url = url.trim();
    if (!url.includes('.') && !url.includes('localhost')) {
      url = `${url}.supabase.co`;
    }
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    try {
      url = new URL(url).origin;
    } catch (e) {}
  }
  
  return createBrowserClient(url, key);
}
