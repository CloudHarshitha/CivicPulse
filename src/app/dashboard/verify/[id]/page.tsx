'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseData } from '@/lib/supabase-data';
import { CheckCircle, XCircle, ArrowLeft, Clock, MapPin, AlertTriangle, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyIssuePage() {
  const params = useParams();
  const router = useRouter();
  const { getIssueById, updateIssue } = useSupabaseData();

  const issueId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const issue = getIssueById(issueId);

  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!issue) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center font-sans">
        <div className="gov-card p-8 space-y-3">
          <AlertTriangle className="w-8 h-8 text-[var(--destructive)] mx-auto" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Docket Record Not Found</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            The requested ticket ID <span className="font-mono">{issueId || 'null'}</span> could not be located.
          </p>
          <Link href="/dashboard/my-reports" className="gov-btn-secondary text-xs uppercase font-bold inline-block">
            Return to My Grievances
          </Link>
        </div>
      </div>
    );
  }

  const handleAction = async (action: 'accept' | 'reject') => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateIssue(issue.id, {
      status: action === 'accept' ? 'verified' : 'open'
    });
    
    if (action === 'accept') {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/my-reports'), 1500);
    } else {
      router.push('/dashboard/my-reports');
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 font-sans">
        <div className="w-16 h-16 bg-[var(--success)] text-white flex items-center justify-center rounded-[2px] mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-[var(--foreground)] mb-2">Resolution Verified & Docket Closed!</h2>
        <p className="text-xs text-[var(--muted-foreground)]">Thank you for confirming municipal work completion.</p>
        <p className="text-[10px] text-[var(--muted-foreground)] font-mono mt-2">Redirecting to My Grievances...</p>
      </div>
    );
  }

  const resolutionData = {
    imageUrl: issue.resolution_photo_url || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
    notes: issue.resolution_notes || 'Municipal repairs completed within PostGIS 15m radius geofence.',
    distance: 2.4,
    timestamp: issue.resolved_at || new Date().toISOString()
  };

  const docketId = `CP-2026-${issue.id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <Link href="/dashboard/my-reports" className="inline-flex items-center text-xs font-bold text-[var(--foreground)] uppercase hover:underline">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Grievances
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            <Building2 size={14} className="text-[#1a1a2e]" />
            CITIZEN AUDIT &bull; DOCKET RESOLUTION CONFIRMATION
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Audit Docket Resolution ({docketId})</h1>
          <p className="text-xs text-[var(--muted-foreground)]">The municipal authority logged this grievance as resolved. Inspect proof of work.</p>
        </div>
      </div>
      
      <div className="gov-card overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Before */}
          <div className="border-b sm:border-b-0 sm:border-r border-[var(--border)]">
            <div className="h-48 relative bg-[#e5e7eb]">
              <img src={issue.photo_url} alt="Before" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-[var(--primary)] text-white px-2 py-0.5 text-[10px] font-mono font-bold">
                BEFORE (REPORTED)
              </div>
            </div>
            <div className="p-3 bg-[var(--card)] text-xs">
              <span className="font-bold text-[var(--foreground)] block mb-1">Your Grievance Statement</span>
              <p className="text-[var(--muted-foreground)] text-[11px] truncate">{issue.title}</p>
            </div>
          </div>
          
          {/* After */}
          <div>
            <div className="h-48 relative bg-[#e5e7eb]">
              <img src={resolutionData.imageUrl} alt="After" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-[var(--success)] text-white px-2 py-0.5 text-[10px] font-mono font-bold">
                AFTER (RESOLVED PROOF)
              </div>
            </div>
            <div className="p-3 bg-[var(--card)] text-xs">
              <span className="font-bold text-[var(--success)] block mb-1">Authority Proof of Work</span>
              <p className="text-[11px] text-[var(--muted-foreground)] font-mono">Geofence Match: {resolutionData.distance}m away</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] space-y-1 text-xs">
          <span className="font-bold text-[var(--foreground)] uppercase block">Contractor Notes:</span>
          <p className="text-[var(--muted-foreground)] italic font-medium">&ldquo;{resolutionData.notes}&rdquo;</p>
        </div>
      </div>

      <div className="gov-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Citizen Verification Sign-Off</h3>
        
        <div>
          <label className="block text-xs font-bold text-[var(--foreground)] uppercase mb-1">Audit Feedback / Notes (Optional)</label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Log comments regarding quality of repair works..."
            rows={2}
            className="w-full p-2.5 bg-white border border-[var(--border)] rounded-[2px] text-xs text-[var(--foreground)] outline-none font-medium resize-none"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('reject')}
            disabled={isSubmitting}
            className="gov-btn-secondary flex-1 text-xs font-bold uppercase py-2.5 flex items-center justify-center gap-1.5"
          >
            <XCircle size={14} /> Reject & Reopen Docket
          </button>
          <button
            onClick={() => handleAction('accept')}
            disabled={isSubmitting}
            className="gov-btn-primary flex-[2] text-xs font-bold uppercase py-2.5 flex items-center justify-center gap-1.5"
          >
            <CheckCircle size={14} /> Confirm & Close Docket
          </button>
        </div>
      </div>
    </div>
  );
}
