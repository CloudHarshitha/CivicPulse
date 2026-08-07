'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import { getCategoryInfo, formatRelativeTime } from '@/lib/scoring';
import { 
  AlertTriangle, Brain, CheckCircle, MapPin, Shield,
  Building2, UserCheck, ArrowRight
} from 'lucide-react';

export default function TriageQueuePage() {
  const { profile } = useAuth();
  const { issues, updateIssue } = useSupabaseData();

  const isAuthority = profile?.role === 'authority';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [assigningIssueId, setAssigningIssueId] = useState<string | null>(null);
  const [contractorName, setContractorName] = useState('');

  if (!isAuthority) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center font-sans">
        <div className="gov-card p-8 space-y-4">
          <div className="w-12 h-12 bg-[var(--primary)] text-white flex items-center justify-center rounded-[2px] mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--foreground)]">Officer Authorization Required</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            The AI Triage &amp; Dispatch Queue is restricted to verified Municipal Authority Officers.
          </p>
          <div className="pt-2">
            <Link href="/dashboard" className="gov-btn-primary text-xs font-bold uppercase inline-block">
              Return to Control Desk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const triageQueue = issues.filter(i => i.status === 'open');

  const filteredQueue = triageQueue.filter(issue => {
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    return true;
  }).sort((a, b) => (b.action_priority_score || 0) - (a.action_priority_score || 0));

  const handleAssignSubmit = (issueId: string) => {
    updateIssue(issueId, {
      status: 'in_progress',
      assigned_to: contractorName || 'Assigned Municipal Unit',
    });
    setAssigningIssueId(null);
    setContractorName('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            <Building2 size={14} className="text-[#1a1a2e]" />
            AUTOMATED TRIAGE &bull; COMPUTER VISION PIPELINE
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Grievance Triage & Contractor Dispatch</h1>
          <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
            Verify computer vision category scores, audit geofences, and dispatch municipal work orders.
          </p>
        </div>

        <div className="bg-[var(--primary)] text-white px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold">
          PENDING TRIAGE: {triageQueue.length} DOCKETS
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
        {[
          { id: 'all', label: `All Dockets (${triageQueue.length})` },
          { id: 'roads', label: 'Roads & Infrastructure' },
          { id: 'sanitation', label: 'Sanitation & Solid Waste' },
          { id: 'electricity', label: 'Power & Streetlights' },
          { id: 'water_sewage', label: 'Water & Drainage' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold whitespace-nowrap transition-colors border ${
              selectedCategory === tab.id
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-white text-[#374151] border-[var(--border)] hover:bg-[var(--background)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {filteredQueue.length === 0 && (
          <div className="gov-card p-12 text-center text-[var(--muted-foreground)] space-y-2">
            <CheckCircle className="w-8 h-8 text-[var(--success)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--foreground)]">Triage Queue Clear</h3>
            <p className="text-xs">All registered dockets in your jurisdiction have been triaged.</p>
          </div>
        )}

        {filteredQueue.map(issue => {
          const catInfo = getCategoryInfo(issue.category);
          const isAssigning = assigningIssueId === issue.id;

          return (
            <div key={issue.id} className="gov-card p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-[#e5e7eb] rounded-[2px] border border-[var(--border)] shrink-0 overflow-hidden">
                    <img src={issue.photo_url} alt={issue.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="gov-badge gov-badge-submitted font-mono">
                        DOCKET: CP-2026-{issue.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold text-[#1a1a2e] uppercase bg-[var(--background)] border border-[var(--border)] px-2 py-0.5">
                        {catInfo.label}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--success)] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-0.5">
                        AI CONFIDENCE 94%
                      </span>
                    </div>

                    <Link href={`/dashboard/issue/${issue.id}`} className="text-base font-bold text-[var(--foreground)] hover:underline block">
                      {issue.title}
                    </Link>

                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{issue.description}</p>

                    <div className="text-[11px] text-[var(--muted-foreground)] font-mono pt-1">
                      <MapPin size={12} className="inline mr-1 text-[var(--foreground)]" />
                      {issue.address || `${issue.city}, Ward`} &bull; Filed {formatRelativeTime(issue.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <button
                    onClick={() => setAssigningIssueId(isAssigning ? null : issue.id)}
                    className="gov-btn-primary text-xs font-bold uppercase flex items-center gap-1.5"
                  >
                    <UserCheck size={14} />
                    {isAssigning ? 'Cancel' : 'Dispatch Field Order'}
                  </button>
                </div>
              </div>

              {isAssigning && (
                <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-[2px] space-y-3">
                  <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide">
                    Dispatch Municipal Work Order
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                      type="text"
                      value={contractorName}
                      onChange={e => setContractorName(e.target.value)}
                      placeholder="Contractor Agency Name"
                      className="p-2 border border-[var(--border)] text-xs font-medium rounded-[2px] outline-none"
                    />
                    <button
                      onClick={() => handleAssignSubmit(issue.id)}
                      className="gov-btn-primary text-xs font-bold uppercase"
                    >
                      Authorize Dispatch
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
