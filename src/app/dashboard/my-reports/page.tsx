'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import { getCategoryInfo, formatRelativeTime } from '@/lib/scoring';
import { getSLARemaining } from '@/lib/sla';
import { MapPin, Clock, ThumbsUp, PlusCircle, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import { IssueStatus } from '@/types';
import { useTranslation } from 'react-i18next';

type Tab = 'ALL' | IssueStatus;

export default function MyReportsPage() {
  const { user, profile } = useAuth();
  const { issues, toggleUpvote } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const { t } = useTranslation();

  const myIssues = issues.filter(i => 
    i.reporter_id === user?.id || 
    i.reporter_id === profile?.id || 
    (user?.email && i.reporter?.email === user.email)
  ).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const filteredIssues = activeTab === 'ALL' 
    ? myIssues 
    : myIssues.filter(i => i.status === activeTab);

  const stats = {
    total: myIssues.length,
    pending: myIssues.filter(i => ['open', 'in_progress'].includes(i.status)).length,
    resolved: myIssues.filter(i => ['resolved', 'verified'].includes(i.status)).length,
  };

  const tabs: { label: string; value: Tab }[] = [
    { label: t('all_dockets'), value: 'ALL' },
    { label: t('submitted_open'), value: 'open' },
    { label: t('in_progress_dispatch'), value: 'in_progress' },
    { label: t('resolved_works'), value: 'resolved' },
    { label: t('verified_complete'), value: 'verified' },
  ];

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'open': return 'gov-badge-submitted';
      case 'in_progress': return 'gov-badge-in_progress';
      case 'resolved': return 'gov-badge-resolved';
      case 'verified': return 'gov-badge-verified';
      default: return 'gov-badge-submitted';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            <Building2 size={14} className="text-[#1a1a2e]" />
            CITIZEN DOCKET REGISTRY &bull; PERSONAL GRIEVANCE LOG
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">{t('my_filed_grievances')}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">{t('track_officer_progress')}</p>
        </div>

        <Link 
          href="/dashboard/report"
          className="gov-btn-primary flex items-center justify-center gap-1.5 text-xs uppercase font-bold"
        >
          <PlusCircle size={14} /> {t('lodge_new_grievance')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">{t('total_dockets')}</span>
          <span className="text-2xl font-black text-[var(--foreground)] font-mono">{stats.total}</span>
        </div>
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">{t('pending_action')}</span>
          <span className="text-2xl font-black text-[var(--foreground)] font-mono">{stats.pending}</span>
        </div>
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--success)] uppercase block mb-1">{t('closed_verified')}</span>
          <span className="text-2xl font-black text-[var(--success)] font-mono">{stats.resolved}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold whitespace-nowrap transition-colors border ${
              activeTab === tab.value 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                : 'bg-white text-[#374151] border-[var(--border)] hover:bg-[var(--background)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredIssues.length === 0 ? (
        <div className="gov-card p-12 text-center text-[var(--muted-foreground)] space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-[var(--muted-foreground)]" />
          <h3 className="text-base font-bold text-[var(--foreground)]">{t('no_dockets_found')}</h3>
          <p className="text-xs">
            {activeTab === 'ALL' 
              ? "You haven't filed any grievances yet." 
              : `No dockets with status "${activeTab}".`}
          </p>
          {activeTab === 'ALL' && (
            <div className="pt-2">
              <Link href="/dashboard/report" className="gov-btn-primary text-xs font-bold uppercase inline-block">
                {t('lodge_new_grievance')}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map(issue => {
            const catInfo = getCategoryInfo(issue.category);
            const slaRemaining = getSLARemaining(issue.sla_deadline);
            const docketId = `CP-2026-${issue.id.slice(0, 4).toUpperCase()}`;
            
            return (
              <div 
                key={issue.id}
                className="gov-card overflow-hidden hover:border-[var(--primary)] transition-colors"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-44 h-40 sm:h-auto bg-[#e5e7eb] shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)] relative">
                    <img 
                      src={issue.photo_url} 
                      alt={issue.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[var(--primary)] text-white px-2 py-0.5 text-[10px] font-mono font-bold">
                      {docketId}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <Link href={`/dashboard/issue/${issue.id}`} className="text-base font-bold text-[var(--foreground)] hover:underline leading-tight">
                          {issue.title}
                        </Link>
                        <span className={`gov-badge ${getBadgeClass(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] font-mono">
                        <span>{catInfo.label}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[var(--foreground)]" />
                          {issue.address || `${issue.city}, Ward`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--muted-foreground)] font-mono flex items-center gap-1">
                          <Clock size={12} /> Filed {formatRelativeTime(issue.created_at)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleUpvote(issue.id, user?.id || '');
                          }}
                          className="flex items-center gap-1 font-bold text-[var(--foreground)] border border-[var(--border)] px-2 py-0.5 rounded-[2px]"
                        >
                          <ThumbsUp size={12} /> {t('endorse')} ({issue.upvote_count})
                        </button>
                      </div>

                      {issue.status === 'resolved' ? (
                        <Link href={`/dashboard/verify/${issue.id}`} className="gov-btn-primary text-[10px] font-bold uppercase py-1 px-2.5 bg-[var(--success)] border-[#166534]">
                          <CheckCircle2 size={12} className="inline mr-1" /> {t('audit_signoff')}
                        </Link>
                      ) : (
                        <Link href={`/dashboard/issue/${issue.id}`} className="gov-btn-secondary text-[10px] font-bold uppercase py-1 px-2.5">
                          {t('inspect_file')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
