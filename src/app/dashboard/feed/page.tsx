'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import { 
  getCategoryInfo, formatRelativeTime 
} from '@/lib/scoring';
import { 
  Filter, MapPin, ThumbsUp, MessageSquare, Clock, Award, Image as ImageIcon,
  Building2, FileText, ExternalLink
} from 'lucide-react';
import { FeedFilters } from '@/types';
import { useTranslation } from 'react-i18next';

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getFilteredIssues, toggleUpvote } = useSupabaseData();
  const { t } = useTranslation();
  
  const [filters, setFilters] = useState<FeedFilters>({
    feedMode: 'ward',
    category: undefined,
    priority: undefined,
    status: undefined,
    sortBy: 'newest'   // Fix #12: must match FeedFilters type
  });

  const issues = getFilteredIssues(filters);

  const handleFilterChange = (key: keyof FeedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCardClick = (issueId: string) => {
    router.push(`/dashboard/issue/${issueId}`);
  };

  const getStatusBadge = (status: string) => {
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
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            <Building2 size={14} className="text-[#1a1a2e]" />
            MUNICIPAL PUBLIC REGISTRY &bull; WARD JURISDICTION
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">{t('nav_feed')}</h1>
          <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
            Official public log of crowdsourced infrastructure defects, verified citizen reports, and resolution logs.
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="gov-card p-4 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)] overflow-x-auto">
          <Filter size={16} className="text-[var(--foreground)] shrink-0" />
          <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider shrink-0">Jurisdiction Scope:</span>
          <div className="flex gap-1 shrink-0">
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-[2px] transition-colors ${filters.feedMode === 'ward' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[#374151] border border-[var(--border)]'}`}
              onClick={() => handleFilterChange('feedMode', 'ward')}
            >
              My Designated Ward
            </button>
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-[2px] transition-colors ${filters.feedMode === 'radius' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[#374151] border border-[var(--border)]'}`}
              onClick={() => handleFilterChange('feedMode', 'radius')}
            >
              Municipal Radius (5km)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[var(--foreground)] uppercase mb-1">Category</label>
            <select 
              className="w-full bg-white border border-[var(--border)] text-[var(--foreground)] text-xs font-medium rounded-[2px] p-2 focus:ring-1 focus:ring-[var(--primary)] outline-none"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
            >
              <option value="">{t('all_categories')}</option>
              <option value="roads">{t('cat_roads')}</option>
              <option value="sanitation">{t('cat_sanitation')}</option>
              <option value="electricity">{t('cat_electricity')}</option>
              <option value="water_sewage">{t('cat_water')}</option>
              <option value="other">{t('cat_other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--foreground)] uppercase mb-1">Status</label>
            <select 
              className="w-full bg-white border border-[var(--border)] text-[var(--foreground)] text-xs font-medium rounded-[2px] p-2 focus:ring-1 focus:ring-[var(--primary)] outline-none"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">{t('all_status')}</option>
              <option value="open">{t('submitted_open')}</option>
              <option value="in_progress">{t('in_progress_dispatch')}</option>
              <option value="resolved">{t('resolved_works')}</option>
              <option value="verified">{t('verified_complete')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--foreground)] uppercase mb-1">Urgency Priority</label>
            <select 
              className="w-full bg-white border border-[var(--border)] text-[var(--foreground)] text-xs font-medium rounded-[2px] p-2 focus:ring-1 focus:ring-[var(--primary)] outline-none"
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
            >
              <option value="">{t('all_priorities')}</option>
              <option value="critical">Critical (P1)</option>
              <option value="medium">Medium (P2)</option>
              <option value="low">Low (P3)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--foreground)] uppercase mb-1">{t('sort_by')}</label>
            <select 
              className="w-full bg-white border border-[var(--border)] text-[var(--foreground)] text-xs font-medium rounded-[2px] p-2 focus:ring-1 focus:ring-[var(--primary)] outline-none"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="newest">{t('newest_first')}</option>
              <option value="priority">{t('highest_aps')}</option>
              <option value="upvotes">{t('most_upvoted')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── DOCKET LIST ── */}
      <div className="space-y-4">
        {issues.length === 0 ? (
          <div className="gov-card p-12 text-center text-[var(--muted-foreground)]">
            <FileText className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-2" />
            <h3 className="text-base font-bold text-[var(--foreground)]">{t('no_dockets_found')}</h3>
            <p className="text-xs mt-1">Try adjusting the category or status filter parameters.</p>
          </div>
        ) : (
          issues.map((issue) => {
            const catInfo = getCategoryInfo(issue.category);
            const docketId = `CP-2026-${issue.id.slice(0, 4).toUpperCase()}`;

            return (
              <div 
                key={issue.id} 
                className="gov-card overflow-hidden hover:border-[var(--primary)] transition-colors cursor-pointer"
                onClick={() => handleCardClick(issue.id)}
              >
                <div className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 rounded-[2px]">
                        {docketId}
                      </span>
                      <span className={`gov-badge ${getStatusBadge(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] font-mono">
                      <span>APS Score: <strong className="text-[var(--foreground)]">{issue.action_priority_score || 75}</strong></span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatRelativeTime(issue.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3 h-32 bg-[#e5e7eb] rounded-[2px] overflow-hidden border border-[var(--border)]">
                      <img src={issue.photo_url} alt={issue.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="md:col-span-9 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="text-base font-bold text-[var(--foreground)] hover:underline">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-1">
                          {issue.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3 font-mono text-[var(--muted-foreground)]">
                          <span>{catInfo.label}</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-[var(--foreground)]" />
                            {issue.address || `${issue.city}, Ward`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUpvote(issue.id, user?.id || '');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--border)] text-[var(--foreground)] font-bold text-xs rounded-[2px] hover:bg-[var(--background)]"
                          >
                            <ThumbsUp size={12} /> {t('endorse')} ({issue.upvote_count})
                          </button>

                          <Link
                            href={`/dashboard/issue/${issue.id}`}
                            className="gov-btn-primary text-[10px] font-bold uppercase py-1 px-3"
                          >
                            {t('inspect_file')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
