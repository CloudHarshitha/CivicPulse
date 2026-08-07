'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import {
  FileText, CheckCircle2, AlertCircle, ThumbsUp,
  ArrowRight, MapPin, PlusCircle, Newspaper, AlertTriangle, Map, Clock,
  Building2, BarChart2, ShieldCheck, Activity
} from 'lucide-react';
import { getCategoryInfo, formatRelativeTime } from '@/lib/scoring';
import { getSLARemaining } from '@/lib/sla';
import { useTranslation } from 'react-i18next';

export default function DashboardHome() {
  const { profile, user } = useAuth();
  const { stats, issues } = useSupabaseData();
  const { t } = useTranslation();

  const isAuthority = profile?.role === 'authority';
  const myReportsCount = issues.filter(i => i.reporter_id === user?.id).length;
  const recentIssues = issues.slice(0, 6);

  // Authority specific statistics
  const pendingTriageCount = issues.filter(i => i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length;
  const resolvedCount = issues.filter(i => ['resolved', 'verified'].includes(i.status)).length;
  const breachedCount = issues.filter(i => {
    if (['resolved', 'verified'].includes(i.status)) return false;
    const sla = getSLARemaining(i.sla_deadline);
    return sla.expired;
  }).length;

  const citizenStatCards = [
    { title: t('my_filed_grievances'), value: myReportsCount, icon: FileText, desc: 'Registered Grievance Filings' },
    { title: t('closed_verified'), value: stats.resolvedIssues || 0, icon: CheckCircle2, desc: 'Closed & Verified Works' },
    { title: t('pending_action'), value: stats.activeIssues || 0, icon: AlertCircle, desc: 'Under Municipal Action' },
    { title: t('most_upvoted'), value: stats.totalUpvotes || 0, icon: ThumbsUp, desc: 'Community Upvotes Logged' }
  ];

  const authorityStatCards = [
    { title: t('nav_triage'), value: pendingTriageCount, icon: AlertTriangle, desc: 'Awaiting SLA Assessment' },
    { title: t('in_progress_dispatch'), value: inProgressCount, icon: Clock, desc: 'Contractor Assigned' },
    { title: 'SLA Breached Cases', value: breachedCount, icon: AlertCircle, desc: 'Exceeded Resolution Deadline' },
    { title: t('verified_complete'), value: resolvedCount, icon: CheckCircle2, desc: 'Audited & Resolved' }
  ];

  const statCards = isAuthority ? authorityStatCards : citizenStatCards;

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'open': return 'gov-badge-submitted';
      case 'in_progress': return 'gov-badge-in_progress';
      case 'resolved': return 'gov-badge-resolved';
      case 'verified': return 'gov-badge-verified';
      case 'rejected': return 'gov-badge-rejected';
      default: return 'gov-badge-submitted';
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* ── 1. ADMINISTRATIVE HEADER BANNER ── */}
      <div className="gov-card p-6 border-l-4 border-l-[#000000]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
              <Building2 size={14} className="text-[#1a1a2e]" />
              MUNICIPAL CONTROL DESK &bull; WARD GENERAL JURISDICTION
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
              Welcome, {profile?.full_name || 'Citizen'}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
              {isAuthority
                ? 'Executive Control Desk: Dispatch contractors, audit work completion certificates, and track SLA timelines.'
                : 'Citizen Portal: File public grievances, track official docket status, and audit municipal progress.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthority ? (
              <>
                <Link
                  href="/dashboard/triage"
                  className="gov-btn-primary flex items-center gap-2 text-xs font-bold uppercase"
                >
                  <AlertTriangle size={14} />
                  {t('nav_triage')}
                </Link>
                <Link
                  href="/dashboard/map"
                  className="gov-btn-secondary flex items-center gap-2 text-xs font-bold uppercase"
                >
                  <Map size={14} />
                  {t('nav_map')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/report"
                  className="gov-btn-primary flex items-center gap-2 text-xs font-bold uppercase"
                >
                  <PlusCircle size={14} />
                  {t('lodge_new_grievance')}
                </Link>
                <Link
                  href="/dashboard/feed"
                  className="gov-btn-secondary flex items-center gap-2 text-xs font-bold uppercase"
                >
                  <Newspaper size={14} />
                  {t('nav_feed')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. STATISTICAL MATRIX CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="gov-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase block mb-1">
                  {card.title}
                </span>
                <span className="text-3xl font-extrabold text-[var(--foreground)] font-mono leading-none">
                  {card.value}
                </span>
              </div>
              <div className="p-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[2px]">
                <card.icon size={20} />
              </div>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium mt-3 border-t border-[var(--border)] pt-2">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3. RECENT DOCKETS & ACTION REGISTRY ── */}
      <div className="gov-card p-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)] uppercase tracking-wide">
              {isAuthority ? 'Priority Dispatch Queue' : 'Recent Grievance Dockets'}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Real-time feed of municipal issues logged within your ward.
            </p>
          </div>
          <Link
            href="/dashboard/feed"
            className="text-xs font-bold text-[var(--foreground)] hover:underline uppercase flex items-center gap-1"
          >
            {t('all_dockets')} <ArrowRight size={12} />
          </Link>
        </div>

        <div className="divide-y divide-[#cfcfcf]">
          {recentIssues.length > 0 ? (
            recentIssues.map((issue) => {
              const catInfo = getCategoryInfo(issue.category);
              const docketId = `CP-2026-${issue.id.slice(0, 4).toUpperCase()}`;

              return (
                <div
                  key={issue.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--card)] px-2 transition-colors rounded-[2px]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-[#e5e7eb] border border-[var(--border)] rounded-[2px] overflow-hidden shrink-0">
                      <img src={issue.photo_url} alt={issue.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5">
                          {docketId}
                        </span>
                        <span className={`gov-badge ${getBadgeClass(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>

                      <Link href={`/dashboard/issue/${issue.id}`} className="text-sm font-bold text-[var(--foreground)] hover:underline block leading-tight">
                        {issue.title}
                      </Link>

                      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] font-mono">
                        <span>{catInfo.label}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[var(--foreground)]" />
                          {issue.address || `${issue.city}, Ward`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between gap-2 shrink-0">
                    <span className="text-xs text-[var(--muted-foreground)] font-mono">
                      Filed {formatRelativeTime(issue.created_at)}
                    </span>
                    <Link
                      href={`/dashboard/issue/${issue.id}`}
                      className="gov-btn-secondary text-[10px] font-bold uppercase py-1 px-3"
                    >
                      {t('inspect_file')}
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-[var(--muted-foreground)] text-xs">
              No recent grievance dockets found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
