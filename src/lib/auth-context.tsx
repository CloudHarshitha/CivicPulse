'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata: Partial<Profile>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) {
        setProfile(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civicpulse_user_profile', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error('Could not fetch profile from DB, loading local profile backup:', err);
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('civicpulse_user_profile');
        if (local) {
          try {
            setProfile(JSON.parse(local));
          } catch (e) {}
        }
      }
    }
  }, [supabase]);

  useEffect(() => {
    const isLoggedOut = typeof window !== 'undefined' && localStorage.getItem('civicpulse_logged_out') === 'true';

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      console.error('Supabase URL not configured correctly.');
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("auth.user", session?.user || null);
      if (session?.user && !isLoggedOut) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else if (!isLoggedOut && typeof window !== 'undefined') {
        const local = localStorage.getItem('civicpulse_user_profile');
        const activeUser = localStorage.getItem('civicpulse_active_user');
        if (local) {
          try {
            const parsedP = JSON.parse(local);
            setProfile(parsedP);
            setUser(activeUser ? JSON.parse(activeUser) : { id: parsedP.id, email: parsedP.email } as any);
          } catch (e) {}
        }
      }
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("auth.user (onAuthStateChange)", session?.user || null);
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else if (!isLoggedOut && typeof window !== 'undefined') {
        const local = localStorage.getItem('civicpulse_user_profile');
        if (local) {
          try {
            setProfile(JSON.parse(local));
          } catch (e) {}
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    console.log("[Auth] signIn attempt for email:", email);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('civicpulse_logged_out');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Don't mock when an explicit error like "Invalid credentials" is returned
      return { error: error.message };
    }
    
    if (data?.user) {
      console.log("auth.user on signIn:", data.user);
      setUser(data.user);
      await fetchProfile(data.user.id);
    } else {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('civicpulse_user_profile');
        if (local) {
          try {
            const parsedP = JSON.parse(local);
            setProfile(parsedP);
            const fallbackUser = { id: parsedP.id || `user-${Date.now()}`, email } as User;
            setUser(fallbackUser);
            localStorage.setItem('civicpulse_active_user', JSON.stringify(fallbackUser));
          } catch (e) {}
        }
      }
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, metadata: Partial<Profile>): Promise<{ error: string | null }> => {
    console.log("[Auth] signUp attempt for email:", email, "with metadata:", metadata);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('civicpulse_logged_out');
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.warn("[Auth] Supabase signUp warning/error:", error.message);
      
      // If we are dealing with a real API error like "User already registered", we MUST surface it to the frontend.
      // We only fallback to local storage mock if the API call didn't result in an explicit API error, 
      // but in this case, error is present, meaning Supabase actually rejected the request.
      return { error: error.message };
    }

    const userId = data?.user?.id || `user-${Date.now()}`;
    const newProfile: Profile = {
      id: userId,
      email,
      full_name: (metadata.full_name as string) || '',
      phone: (metadata.phone as string) || '',
      role: (metadata.role as any) || 'citizen',
      state: (metadata.state as string) || '',
      district: (metadata.district as string) || '',
      city: (metadata.city as string) || '',
      ward: (metadata.ward as string) || 'General',
      aadhaar_number: (metadata.aadhaar_number as string) || '',
      is_verified: true,
      avatar_url: (metadata.avatar_url as string) || null,
      latitude: (metadata.latitude as number) || null,
      longitude: (metadata.longitude as number) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (data?.user) {
      console.log("auth.user on signUp:", data.user);
      const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
      if (profileError) {
        console.warn("[Auth] Profile DB insert warning:", profileError.message);
      }
    }

    // Immediately populate React state & persistent storage
    const activeUser = (data?.user as User) || ({ id: userId, email } as User);
    setUser(activeUser);
    setProfile(newProfile);

    if (typeof window !== 'undefined') {
      localStorage.setItem('civicpulse_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('civicpulse_active_user', JSON.stringify(activeUser));
    }

    return { error: null };
  };

  const signOut = async () => {
    console.log("[Auth] signOut triggered. Preserving report data in persistence store.");
    if (typeof window !== 'undefined') {
      localStorage.setItem('civicpulse_logged_out', 'true');
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Primary: use PATCH /api/profile endpoint
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `Server error ${res.status}`);
      }

      // Update React state from server response
      if (result.data) {
        setProfile(result.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civicpulse_user_profile', JSON.stringify(result.data));
        }
      } else {
        // Fallback: re-fetch from DB
        await fetchProfile(user.id);
      }

      return { error: null };
    } catch (apiErr: any) {
      console.warn('[Auth] API profile update failed, trying direct Supabase:', apiErr.message);

      // Fallback: direct Supabase update
      try {
        const { error: dbErr } = await supabase
          .from('profiles')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (dbErr) {
          console.warn('[Auth] Supabase direct update also failed:', dbErr.message);
        }

        // Even if DB fails, update local state and localStorage so the UI stays correct
        const merged = { ...(profile || {}), ...data, updated_at: new Date().toISOString() } as Profile;
        setProfile(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civicpulse_user_profile', JSON.stringify(merged));
        }

        return { error: dbErr ? dbErr.message : null };
      } catch (fallbackErr: any) {
        // Last resort: just update local state
        const merged = { ...(profile || {}), ...data, updated_at: new Date().toISOString() } as Profile;
        setProfile(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civicpulse_user_profile', JSON.stringify(merged));
        }
        return { error: fallbackErr.message || 'Profile save failed' };
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
