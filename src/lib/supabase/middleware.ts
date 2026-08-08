import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Fix #21: sanitise the Supabase URL the same way client/server/admin do
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  if (supabaseUrl) {
    supabaseUrl = supabaseUrl.trim();
    if (!supabaseUrl.includes('.') && !supabaseUrl.includes('localhost')) {
      supabaseUrl = `${supabaseUrl}.supabase.co`;
    }
    if (!supabaseUrl.startsWith('http')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }
    try {
      supabaseUrl = new URL(supabaseUrl).origin;
    } catch { /* keep as-is */ }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ['/dashboard', '/report', '/feed', '/my-reports', '/authority', '/resolve', '/verify'];
  const isProtectedRoute = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Auth routes - redirect to dashboard if already logged in
  const authPaths = ['/login', '/register'];
  const isAuthRoute = authPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
