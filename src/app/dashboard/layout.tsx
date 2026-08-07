'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, Newspaper, Map, FileText,
  Clock, AlertTriangle, Bell, LogOut, Settings, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import { formatRelativeTime } from '@/lib/scoring';
import { TopGovBar } from '@/components/TopGovBar';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, loading, signOut } = useAuth();
  const { getUserNotifications, getUnreadCount, markNotificationRead } = useSupabaseData();
  const { t } = useTranslation();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthority = mounted && profile?.role === 'authority';
  const unreadCount = mounted ? getUnreadCount(profile?.id || '') : 0;
  const notifications = mounted ? getUserNotifications(profile?.id || '') : [];

  const citizenSidebarLinks = [
    { name: t('nav_dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav_report'), href: '/dashboard/report', icon: PlusCircle },
    { name: t('nav_feed'), href: '/dashboard/feed', icon: Newspaper },
    { name: t('nav_map'), href: '/dashboard/map', icon: Map },
    { name: t('nav_my_reports'), href: '/dashboard/my-reports', icon: FileText },
    { name: t('nav_settings'), href: '/dashboard/settings', icon: Settings },
  ];

  const authoritySidebarLinks = [
    { name: t('nav_dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav_triage'), href: '/dashboard/triage', icon: AlertTriangle },
    { name: t('nav_sla'), href: '/dashboard/sla', icon: Clock },
    { name: t('nav_map'), href: '/dashboard/map', icon: Map },
    { name: t('nav_settings'), href: '/dashboard/settings', icon: Settings },
  ];

  const desktopNavLinks = isAuthority ? authoritySidebarLinks : citizenSidebarLinks;

  if (loading || !user) {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center text-[var(--muted-foreground)]">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest">Verifying Identity...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans" suppressHydrationWarning>

      {/* ── 1. OFFICIAL TOP GOVERNMENT STRIP ── */}
      <TopGovBar />

      {/* ── 2. MAIN GOVERNMENT NAVBAR (72px) ── */}
      <header className="sticky top-0 z-50 h-[72px] bg-white border-b border-[var(--border)] shadow-xs">
        <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-6">

          {/* Logo & Emblem */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-[var(--primary)] text-white flex items-center justify-center font-black rounded-[2px] text-lg tracking-wider border border-[var(--primary)]">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg xl:text-xl font-bold tracking-tight text-[var(--foreground)]">CivicPulse</span>
                <span className="text-[10px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-[2px] uppercase font-bold tracking-widest hidden sm:inline-block">
                  {t('official_portal')}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] font-medium tracking-wide">
                {t('subtitle')}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Main Navigation">
            {desktopNavLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm font-semibold rounded-[3px] border
                    transition-all duration-150 whitespace-nowrap
                    ${isActive
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-white text-[#374151] border-transparent hover:bg-[var(--background)] hover:text-[var(--foreground)]'
                    }
                  `}
                >
                  <item.icon size={15} className="shrink-0 xl:w-[15px] xl:h-[15px] w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 xl:gap-3 shrink-0">

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
                className="relative p-2.5 rounded-[3px] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
                aria-haspopup="true"
                aria-expanded={isNotificationsOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[var(--destructive)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white border border-[var(--border)] shadow-md rounded-[4px] overflow-hidden z-50"
                  role="menu"
                >
                  <div className="px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">Official Notifications</h3>
                    <span className="text-xs bg-[var(--dark-grey)] text-white px-2 py-0.5 rounded-[2px] font-bold">{unreadCount} UNREAD</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#cfcfcf]">
                    {notifications.length > 0 ? notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-[var(--background)] cursor-pointer transition-colors ${!notif.is_read ? 'bg-[#f0f4f8]' : ''}`}
                        onClick={() => markNotificationRead(notif.id)}
                        role="menuitem"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && markNotificationRead(notif.id)}
                      >
                        <p className={`text-xs ${!notif.is_read ? 'text-[var(--foreground)] font-bold' : 'text-[var(--muted-foreground)]'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-[var(--muted-foreground)] mt-1 block font-mono">{formatRelativeTime(notif.created_at)}</span>
                      </div>
                    )) : (
                      <div className="px-4 py-8 text-center text-[var(--muted-foreground)] text-xs">
                        <Bell className="w-6 h-6 mx-auto mb-2 opacity-40 text-[#5c5c5c]" />
                        No pending official alerts
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-[var(--border)] bg-white hover:bg-[var(--background)] transition-colors"
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
                aria-label="User Menu"
              >
                <div className="h-7 w-7 bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs shrink-0 rounded-[2px]">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-[var(--foreground)] max-w-[110px] truncate leading-tight">
                    {profile?.full_name || 'Citizen'}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase">
                    {profile?.role || 'Citizen'}
                  </p>
                </div>
                <ChevronDown size={14} className="text-[var(--muted-foreground)] hidden md:block" />
              </button>

              {isProfileOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-[var(--border)] shadow-md rounded-[4px] overflow-hidden z-50"
                  role="menu"
                >
                  <div className="px-4 py-3 bg-[var(--card)] border-b border-[var(--border)]">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">{profile?.full_name || 'Citizen'}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] font-mono truncate">{profile?.email || 'citizen@gov.in'}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#374151] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                      onClick={() => setIsProfileOpen(false)}
                      role="menuitem"
                    >
                      <Settings size={14} /> {t('nav_settings')}
                    </Link>
                    <button
                      onClick={async () => { setIsProfileOpen(false); await signOut(); router.push('/login'); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[var(--destructive)] hover:bg-[#fee2e2]"
                      role="menuitem"
                    >
                      <LogOut size={14} /> {t('sign_out')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. MAIN DASHBOARD CONTENT (MAX 1280PX) ── */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        {children}
      </main>

      {/* ── 4. MOBILE BOTTOM NAVIGATION ── */}
      <nav className="lg:hidden flex items-stretch bottom-nav bg-[var(--card)] border-t border-[var(--border)]" aria-label="Mobile Navigation">
        {desktopNavLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="bottom-nav-label text-[10px] uppercase font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
