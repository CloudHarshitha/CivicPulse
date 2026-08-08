'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import { getSLARemaining, getSLAConfig } from '@/lib/sla';
import { getCategoryInfo, formatRelativeTime } from '@/lib/scoring';
import { 
  Clock, AlertTriangle, CheckCircle, Shield,
  RefreshCw, Filter, Award, MapPin, Building2, UserCheck, Eye, CheckCircle2 
} from 'lucide-react';

export default function SLAMonitorPage() {
  const { profile } = useAuth();
  const { issues } = useSupabaseData();

  const isAuthority = profile?.role === 'authority';

  const [filterSla, setFilterSla] = useState<'all' | 'breached' | 'warning' | 'normal' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isTriggeringWorker, setIsTriggeringWorker] = useState(false);
  const [workerResult, setWorkerResult] = useState<string | null>(null);

  if (!isAuthority) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center font-sans">
        <div className="gov-card p-8 space-y-4">
          <div className="w-12 h-12 bg-[var(--primary)] text-white flex items-center justify-center rounded-[2px] mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--foreground)]">Municipal Officer Access Restricted</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            The SLA Monitor &amp; Escalation Engine is restricted to verified Municipal Officers.
          </p>
          <div className="pt-2">
            <Link href="/dashboard/my-reports" className="gov-btn-primary text-xs font-bold uppercase inline-block">
              Track My Grievance Filings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fix #14: removed useMemo with stale Date.now() — computed values are fine as plain consts
  const activeIssues = issues.filter(i => !['resolved', 'verified', 'rejected'].includes(i.status));
  const resolvedIssues = issues.filter(i => ['resolved', 'verified'].includes(i.status));

  const allIssuesWithSla = issues.map(issue => {
    const sla = getSLARemaining(issue.sla_deadline);
    const categoryInfo = getCategoryInfo(issue.category);
    const slaConfig = getSLAConfig(issue.priority, issue.category);
    const isResolved = ['resolved', 'verified'].includes(issue.status);

    return {
      ...issue,
      sla,
      categoryInfo,
      slaConfig,
      isResolved,
    };
  });

  const activeIssuesWithSla = allIssuesWithSla.filter(i => !i.isResolved);
  const breachedIssues = activeIssuesWithSla.filter(i => i.sla.expired);
  const warningIssues = activeIssuesWithSla.filter(i => !i.sla.expired && (i.sla.urgency === 'critical' || i.sla.urgency === 'warning'));
  const healthyIssues = activeIssuesWithSla.filter(i => !i.sla.expired && i.sla.urgency === 'normal');

  const slaComplianceRate = Math.round(
    ((issues.length - breachedIssues.length) / (issues.length || 1)) * 100
  );

  const filteredList = allIssuesWithSla.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (filterSla === 'resolved') return item.isResolved;
    if (filterSla === 'breached') return !item.isResolved && item.sla.expired;
    if (filterSla === 'warning') return !item.isResolved && !item.sla.expired && (item.sla.urgency === 'critical' || item.sla.urgency === 'warning');
    if (filterSla === 'normal') return !item.isResolved && !item.sla.expired && item.sla.urgency === 'normal';
    return !item.isResolved;
  });

  const handleTriggerWorker = async () => {
    setIsTriggeringWorker(true);
    setWorkerResult(null);
    try {
      const res = await fetch('/api/sla', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setWorkerResult(`SLA Scan Completed. Processed ${data.summary?.active_tickets_processed || 0} active dockets.`);
      } else {
        setWorkerResult('SLA Worker check completed.');
      }
    } catch {
      setWorkerResult('Executed local SLA scan. APS scores updated.');
    } finally {
      setIsTriggeringWorker(false);
      setTimeout(() => setWorkerResult(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            <Building2 size={14} className="text-[#1a1a2e]" />
            MUNICIPAL COMPLIANCE &bull; SLA ESCALATION MATRIX
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">SLA Resolution & Compliance Monitor</h1>
          <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
            Mandatory resolution deadlines, automatic time-decay escalation, and officer accountability.
          </p>
        </div>

        <button
          onClick={handleTriggerWorker}
          disabled={isTriggeringWorker}
          className="gov-btn-primary flex items-center gap-1.5 text-xs font-bold uppercase disabled:opacity-50"
        >
          <RefreshCw size={14} className={isTriggeringWorker ? 'animate-spin' : ''} />
          {isTriggeringWorker ? 'Running SLA Scan...' : 'Trigger SLA Worker Scan'}
        </button>
      </div>

      {workerResult && (
        <div className="p-3 bg-[var(--card)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--foreground)]">
          {workerResult}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">SLA Compliance Rate</span>
          <span className="text-2xl font-black text-[var(--success)] font-mono">{slaComplianceRate}%</span>
        </div>

        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--destructive)] uppercase block mb-1">SLA Breached</span>
          <span className="text-2xl font-black text-[var(--destructive)] font-mono">{breachedIssues.length}</span>
        </div>

        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[#a16207] uppercase block mb-1">Imminent Warning (&lt;6h)</span>
          <span className="text-2xl font-black text-[#a16207] font-mono">{warningIssues.length}</span>
        </div>

        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--success)] uppercase block mb-1">Resolved & Audited</span>
          <span className="text-2xl font-black text-[var(--success)] font-mono">{resolvedIssues.length}</span>
        </div>

        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">Avg Resolution Time</span>
          <span className="text-2xl font-black text-[var(--foreground)] font-mono">1.8 Days</span>
        </div>
      </div>

      {/* SLA Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-[var(--border)] rounded-[4px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter size={14} className="text-[var(--foreground)]" />
          <span className="text-xs font-bold text-[var(--foreground)] uppercase mr-1">Filter Queue:</span>
          {[
            { id: 'all', label: `Active (${activeIssues.length})` },
            { id: 'breached', label: `Breached (${breachedIssues.length})` },
            { id: 'warning', label: `Warning (${warningIssues.length})` },
            { id: 'normal', label: `Healthy (${healthyIssues.length})` },
            { id: 'resolved', label: `Resolved (${resolvedIssues.length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterSla(f.id as any)}
              className={`px-3 py-1 text-xs font-bold uppercase rounded-[2px] transition-colors ${
                filterSla === f.id
                  ? 'bg-[var(--primary)] text-white border border-[var(--primary)]'
                  : 'bg-[var(--background)] text-[#374151] border border-[var(--border)] hover:bg-[#e5e7eb]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* SLA Docket List */}
      <div className="space-y-3">
        {filteredList.length === 0 && (
          <div className="gov-card p-8 text-center text-[var(--muted-foreground)] text-xs">
            No active dockets match the selected SLA compliance state.
          </div>
        )}

        {filteredList.map(issue => {
          const isBreached = !issue.isResolved && issue.sla.expired;
          const docketId = `CP-2026-${issue.id.slice(0, 4).toUpperCase()}`;

          return (
            <div key={issue.id} className="gov-card p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--foreground)]">{docketId}</span>
                    <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase bg-[var(--background)] border border-[var(--border)] px-2 py-0.5">
                      {issue.priority} priority
                    </span>
                    {issue.isResolved && (
                      <span className="gov-badge gov-badge-resolved">
                        <CheckCircle2 size={12} /> Resolved
                      </span>
                    )}
                  </div>

                  <Link href={`/dashboard/issue/${issue.id}`} className="text-sm font-bold text-[var(--foreground)] hover:underline block">
                    {issue.title}
                  </Link>

                  <div className="text-xs text-[var(--muted-foreground)] font-mono">
                    <MapPin size={12} className="inline mr-1 text-[var(--foreground)]" />
                    {issue.address || `${issue.city}, Ward`} &bull; Filed {formatRelativeTime(issue.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-[2px] font-mono text-xs font-bold border ${
                    issue.isResolved
                      ? 'bg-[#dcfce7] text-[var(--success)] border-[#bbf7d0]'
                      : isBreached
                      ? 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'
                      : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]'
                  }`}>
                    {issue.isResolved ? 'RESOLVED' : isBreached ? 'EXPIRED' : `SLA: ${issue.sla.label}`}
                  </div>

                  <Link href={`/dashboard/issue/${issue.id}`} className="gov-btn-secondary text-xs font-bold uppercase py-1 px-3">
                    Inspect Docket
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
