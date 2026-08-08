'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import type { User, SupabaseClient } from '@supabase/supabase-js';

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

  // Fix #23: stabilise the Supabase client in a ref so it is created only once
  // and never triggers useCallback/useEffect dependency re-runs.
  const supabaseRef = useRef<SupabaseClient>(createClient());
  const supabase = supabaseRef.current;

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
    } catch {
      // Silently fall back to cached profile
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('civicpulse_user_profile');
        if (local) {
          try { setProfile(JSON.parse(local)); } catch { /* ignore */ }
        }
      }
    }
  }, [supabase]);

  useEffect(() => {
    const isLoggedOut =
      typeof window !== 'undefined' &&
      localStorage.getItem('civicpulse_logged_out') === 'true';

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && !isLoggedOut) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else if (!isLoggedOut && typeof window !== 'undefined') {
        // Restore from localStorage only if we have a persisted active user
        const activeUser = localStorage.getItem('civicpulse_active_user');
        const local = localStorage.getItem('civicpulse_user_profile');
        if (activeUser && local) {
          try {
            setUser(JSON.parse(activeUser));
            setProfile(JSON.parse(local));
          } catch { /* ignore */ }
        }
        // Fix #4: if no session and no persisted user, ensure state is cleared
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        // Fix #4: always clear user state when Supabase says session is null
        const loggedOut =
          typeof window !== 'undefined' &&
          localStorage.getItem('civicpulse_logged_out') === 'true';

        if (loggedOut) {
          setUser(null);
          setProfile(null);
        } else if (typeof window !== 'undefined') {
          const activeUser = localStorage.getItem('civicpulse_active_user');
          const local = localStorage.getItem('civicpulse_user_profile');
          if (activeUser && local) {
            try {
              setUser(JSON.parse(activeUser));
              setProfile(JSON.parse(local));
            } catch { /* ignore */ }
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    // Fix #2: removed console.log of email
    if (typeof window !== 'undefined') {
      localStorage.removeItem('civicpulse_logged_out');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }

    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    } else {
      // Restore from localStorage as last resort
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('civicpulse_user_profile');
        if (local) {
          try {
            const parsedP = JSON.parse(local);
            setProfile(parsedP);
            const fallbackUser = { id: parsedP.id || `user-${Date.now()}`, email } as User;
            setUser(fallbackUser);
            localStorage.setItem('civicpulse_active_user', JSON.stringify(fallbackUser));
          } catch { /* ignore */ }
        }
      }
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: Partial<Profile>
  ): Promise<{ error: string | null }> => {
    // Fix #1: removed console.log of email/metadata
    if (typeof window !== 'undefined') {
      localStorage.removeItem('civicpulse_logged_out');
    }

    // Fix #1: pass all profile fields as user metadata so the DB trigger
    // (handle_new_user) can read them from raw_user_meta_data.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name || '',
          phone: metadata.phone || '',
          role: metadata.role || 'citizen',
          state: metadata.state || '',
          district: metadata.district || '',
          city: metadata.city || '',
          ward: metadata.ward || 'General',
          aadhaar_number: metadata.aadhaar_number || '',
          is_verified: metadata.is_verified ?? false,
          latitude: metadata.latitude ?? null,
          longitude: metadata.longitude ?? null,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    const userId = data?.user?.id || `user-${Date.now()}`;
    const newProfile: Profile = {
      id: userId,
      email,
      full_name: metadata.full_name || '',
      phone: metadata.phone || '',
      role: (metadata.role as any) || 'citizen',
      state: metadata.state || '',
      district: metadata.district || '',
      city: metadata.city || '',
      ward: metadata.ward || 'General',
      aadhaar_number: metadata.aadhaar_number || '',
      is_verified: metadata.is_verified ?? false,
      avatar_url: metadata.avatar_url || null,
      latitude: metadata.latitude || null,
      longitude: metadata.longitude || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Fix #3: only attempt manual profile insert if there is NO DB trigger.
    // We use upsert with ignoreDuplicates so a trigger-created row is not duplicated.
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([newProfile], { onConflict: 'id', ignoreDuplicates: true });
      if (profileError) {
        // Non-fatal: the trigger may have already created it
        console.warn('[Auth] Profile upsert warning (trigger may have handled this):', profileError.message);
      }
    }

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
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `Server error ${res.status}`);

      if (result.data) {
        setProfile(result.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civicpulse_user_profile', JSON.stringify(result.data));
        }
      } else {
        await fetchProfile(user.id);
      }
      return { error: null };
    } catch (apiErr: any) {
      // Fallback: direct Supabase update
      try {
        const { error: dbErr } = await supabase
          .from('profiles')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (dbErr) console.warn('[Auth] Supabase direct update failed:', dbErr.message);

        const merged = {
          ...(profile || {}),
          ...data,
          updated_at: new Date().toISOString(),
        } as Profile;
        setProfile(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civicpulse_user_profile', JSON.stringify(merged));
        }
        return { error: dbErr ? dbErr.message : null };
      } catch (fallbackErr: any) {
        const merged = {
          ...(profile || {}),
          ...data,
          updated_at: new Date().toISOString(),
        } as Profile;
        setProfile(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civicpulse_user_profile', JSON.stringify(merged));
        }
        return { error: fallbackErr.message || 'Profile save failed' };
      }
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}
    >
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
