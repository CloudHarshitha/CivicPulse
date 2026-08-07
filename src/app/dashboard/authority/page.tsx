'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import { getSLARemaining } from '@/lib/sla';
import { Issue } from '@/types';
import { Filter, AlertTriangle, CheckCircle, Clock, MapPin, X, Building2, UserCheck } from 'lucide-react';

export default function AuthorityDashboard() {
  const { profile } = useAuth();
  const { issues, updateIssue } = useSupabaseData();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  
  const [contractorName, setContractorName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  
  const filteredIssues = issues.filter(issue => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => b.action_priority_score - a.action_priority_score);

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'open').length,
    active: issues.filter(i => i.status === 'in_progress').length,
    resolvedWeek: issues.filter(i => ['resolved', 'verified'].includes(i.status)).length,
    breached: issues.filter(i => {
      if (['resolved', 'verified'].includes(i.status)) return false;
      const slaInfo = getSLARemaining(i.sla_deadline);
      return slaInfo.expired;
    }).length
  };

  const handleAssign = () => {
    if (!selectedIssue) return;
    
    updateIssue(selectedIssue.id, {
      status: 'in_progress',
    });
    
    setSelectedIssue(null);
    setContractorName('');
    setContractorPhone('');
    setAssignmentNotes('');
  };

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
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            <Building2 size={14} className="text-[#1a1a2e]" />
            EXECUTIVE CONTROL DESK &bull; MUNICIPAL CONTRACTOR DISPATCH
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Authority Control & Triage Portal</h1>
          <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
            Officer Command Desk: Dispatch contractors, manage ward dockets, and monitor SLA compliance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">Total Dockets</span>
          <span className="text-2xl font-black text-[var(--foreground)] font-mono">{stats.total}</span>
        </div>
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">Pending Triage</span>
          <span className="text-2xl font-black text-[var(--foreground)] font-mono">{stats.pending}</span>
        </div>
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">Active Dispatches</span>
          <span className="text-2xl font-black text-[var(--foreground)] font-mono">{stats.active}</span>
        </div>
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--destructive)] uppercase block mb-1">SLA Breached</span>
          <span className="text-2xl font-black text-[var(--destructive)] font-mono">{stats.breached}</span>
        </div>
        <div className="gov-card p-4">
          <span className="text-[10px] font-bold text-[var(--success)] uppercase block mb-1">Work Resolved</span>
          <span className="text-2xl font-black text-[var(--success)] font-mono">{stats.resolvedWeek}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--foreground)]" />
          <span className="text-xs font-bold text-[var(--foreground)] uppercase">Filter Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] rounded-[2px] px-3 py-1.5 focus:ring-1 focus:ring-[var(--primary)] outline-none"
          >
            <option value="all">All Status</option>
            <option value="open">Open / Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Grievance / Docket ID</th>
                <th>Location</th>
                <th>Urgency (APS Score)</th>
                <th>Status</th>
                <th>SLA Countdown</th>
                <th className="text-right">Officer Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map(issue => {
                const slaRemaining = getSLARemaining(issue.sla_deadline);
                const isResolved = ['resolved', 'verified'].includes(issue.status);
                const docketId = `CP-2026-${issue.id.slice(0, 4).toUpperCase()}`;

                return (
                  <tr key={issue.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {issue.photo_url ? (
                          <img src={issue.photo_url} className="w-9 h-9 rounded-[2px] object-cover border border-[var(--border)]" alt="" />
                        ) : (
                          <div className="w-9 h-9 bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs">CP</div>
                        )}
                        <div>
                          <p className="font-bold text-xs text-[var(--foreground)] max-w-[220px] truncate">{issue.title}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)] font-mono">{docketId} &bull; {issue.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-[var(--foreground)]" />
                        {issue.address?.split(',')[0] || `${issue.city}, Ward`}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-bold text-[var(--foreground)]">
                      {issue.priority.toUpperCase()} (APS {issue.action_priority_score})
                    </td>
                    <td>
                      <span className={`gov-badge ${getBadgeClass(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-bold">
                      {isResolved ? (
                        <span className="text-[var(--success)] flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Resolved</span>
                      ) : (
                        <span className={slaRemaining.expired ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}>
                          {slaRemaining.label}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/issue/${issue.id}`} className="gov-btn-secondary text-[11px] py-1 px-2.5 font-bold uppercase">
                          Inspect
                        </Link>
                        {issue.status === 'open' && (
                          <button 
                            onClick={() => setSelectedIssue(issue)}
                            className="gov-btn-primary text-[11px] py-1 px-2.5 font-bold uppercase"
                          >
                            Dispatch Contractor
                          </button>
                        )}
                        {issue.status === 'in_progress' && (
                          <Link 
                            href={`/dashboard/resolve/${issue.id}`}
                            className="gov-btn-primary text-[11px] py-1 px-2.5 font-bold uppercase bg-[var(--success)] border-[#166534]"
                          >
                            Audit Certificate
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--muted-foreground)] text-xs">
                    No grievance records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--border)] rounded-[4px] max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                <UserCheck size={16} /> Assign Contractor & Dispatch Work Order
              </h3>
              <button onClick={() => setSelectedIssue(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X size={18} />
              </button>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] p-3 text-xs">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] block font-mono">DOCKET: CP-2026-{selectedIssue.id.slice(0, 4).toUpperCase()}</span>
              <p className="font-bold text-[var(--foreground)]">{selectedIssue.title}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[var(--foreground)] mb-1">Contractor / Agency Name</label>
                <input 
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="e.g. National Infra Ltd."
                  className="w-full p-2 border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[var(--foreground)] mb-1">Contact Phone</label>
                <input 
                  type="tel"
                  value={contractorPhone}
                  onChange={(e) => setContractorPhone(e.target.value)}
                  placeholder="10-digit Phone Number"
                  className="w-full p-2 border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[var(--foreground)] mb-1">Dispatch Instructions</label>
                <textarea 
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={2}
                  placeholder="Official instructions for repair works..."
                  className="w-full p-2 border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
              <button 
                onClick={() => setSelectedIssue(null)}
                className="gov-btn-secondary flex-1 text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssign}
                className="gov-btn-primary flex-1 text-xs font-bold uppercase"
              >
                Dispatch Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
