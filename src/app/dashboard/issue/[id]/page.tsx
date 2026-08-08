'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseData } from '@/lib/supabase-data';
import { useAuth } from '@/lib/auth-context';
import { 
  getCategoryInfo, formatRelativeTime 
} from '@/lib/scoring';
import { getSLARemaining } from '@/lib/sla';
import { 
  ArrowLeft, MapPin, Clock, Award, ThumbsUp, Send, 
  User, CheckCircle2, AlertTriangle, MessageSquare, Image as ImageIcon,
  Building2, Printer, ShieldCheck, FileText
} from 'lucide-react';
import dynamic from 'next/dynamic';

const IssueLocationMap = dynamic(
  () => import('@/components/IssueLocationMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[var(--background)] flex flex-col items-center justify-center text-[var(--muted-foreground)] min-h-[200px]">
        <p className="text-xs font-mono">Loading GIS Map Tile...</p>
      </div>
    ),
  }
);

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const { getIssueById, isLoading, toggleUpvote, getCommentsForIssue, addComment } = useSupabaseData();
  
  const issueId = typeof params.id === 'string' ? params.id : '';
  const issue = getIssueById(issueId);

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  
  const comments = getCommentsForIssue(issueId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent animate-spin mb-3" />
        <p className="text-[var(--muted-foreground)] text-xs font-mono">Loading Official Docket Records...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="gov-card p-12 text-center max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">Docket Record Not Found</h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-6">The grievance file requested does not exist or has been archived.</p>
        <button 
          onClick={() => router.back()}
          className="gov-btn-secondary text-xs uppercase font-bold"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const category = getCategoryInfo(issue.category);
  const slaRemaining = getSLARemaining(issue.sla_deadline);
  const isAuthority = profile?.role === 'authority';
  const docketId = `CP-2026-${issue.id.slice(0, 6).toUpperCase()}`;

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError('');

    const trimmed = commentText.trim();
    if (!trimmed) {
      setCommentError("Please enter text prior to logging comment.");
      return;
    }

    setIsSubmittingComment(true);
    const userId = profile?.id || 'demo-user';

    try {
      await addComment({
        issue_id: issueId,
        user_id: userId,
        content: trimmed,
        photo_url: null,
        user: profile || undefined
      });
      setCommentText('');
    } catch (err: any) {
      setCommentError(err?.message || "Failed to log comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)] hover:underline uppercase"
        >
          <ArrowLeft size={14} /> Back to Grievance Registry
        </button>

        <button 
          onClick={() => window.print()}
          className="gov-btn-secondary flex items-center gap-1.5 text-xs uppercase font-bold"
        >
          <Printer size={14} /> Print Official Case File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Official Docket Header & Image */}
          <div className="gov-card overflow-hidden">
            <div className="gov-card-header flex items-center justify-between border-b border-[var(--border)] bg-[var(--primary)] text-white">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#ff9933]" />
                <span className="font-mono font-bold text-xs tracking-wider">OFFICIAL CASE FILE: {docketId}</span>
              </div>
              <span className={`gov-badge ${getBadgeClass(issue.status)}`}>
                {issue.status.replace('_', ' ')}
              </span>
            </div>

            {/* Photo Attachment */}
            <div className="relative h-64 bg-[#e5e7eb] border-b border-[var(--border)] flex items-center justify-center">
              {issue.photo_url ? (
                <img src={issue.photo_url} alt={issue.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--background)] text-[var(--muted-foreground)]">
                  <ImageIcon size={48} className="opacity-40" />
                  <span className="text-xs font-bold uppercase mt-2">No Image Attachment Filed</span>
                </div>
              )}
            </div>

            {/* Case Details */}
            <div className="p-6 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
                  CATEGORY: {category.label.toUpperCase()}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-[var(--foreground)] mb-4 leading-tight">{issue.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)] border-b border-[var(--border)] pb-4 mb-4 font-mono">
                  <span className="flex items-center gap-1">
                    <User size={14} /> Filer: <strong className="text-[var(--foreground)]">Verified Citizen</strong>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Registered: {formatRelativeTime(issue.created_at)}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> Ward: {issue.ward || 'General'}
                  </span>
                </div>
                
                <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-[2px]">
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Official Grievance Statement:</span>
                  <p className="text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-wrap font-medium">{issue.description}</p>
                </div>
              </div>

              {/* Resolution Evidence Box if Resolved */}
              {['resolved', 'verified'].includes(issue.status) && (
                <div className="bg-[#dcfce7] border border-[#bbf7d0] p-5 rounded-[4px] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--success)]">
                    <CheckCircle2 size={18} />
                    <span>WORK COMPLETION & RESOLUTION CERTIFICATE</span>
                  </div>
                  {issue.resolution_notes && (
                    <div className="bg-white border border-[#bbf7d0] p-3 rounded-[2px] text-xs">
                      <span className="font-bold text-[var(--foreground)] block mb-1">Contractor Notes:</span>
                      <p className="text-[var(--muted-foreground)] italic">&ldquo;{issue.resolution_notes}&rdquo;</p>
                    </div>
                  )}
                  {issue.resolution_photo_url && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[var(--success)] block">Post-Resolution Photographic Proof:</span>
                      <div className="h-48 rounded-[2px] overflow-hidden border border-[#bbf7d0] max-w-md bg-black">
                        <img src={issue.resolution_photo_url} alt="Resolution Proof" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Endorse & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
                <button 
                  onClick={() => toggleUpvote(issue.id, profile?.id || '')}
                  className={`gov-btn-secondary flex items-center gap-2 text-xs font-bold uppercase ${issue.user_has_upvoted ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : ''}`}
                >
                  <ThumbsUp size={14} className={issue.user_has_upvoted ? "fill-white" : ""} />
                  Endorse Filing ({issue.upvote_count})
                </button>

                {isAuthority && !['resolved', 'verified'].includes(issue.status) && (
                  <div className="flex gap-2">
                    <Link 
                      href="/dashboard/triage" 
                      className="gov-btn-secondary text-xs font-bold uppercase"
                    >
                      Triage Queue
                    </Link>
                    <Link 
                      href={`/dashboard/resolve/${issue.id}`}
                      className="gov-btn-primary text-xs font-bold uppercase"
                    >
                      Complete Work Resolution
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit & Discussion Log */}
          <div id="comments" className="gov-card p-6">
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-[#1a1a2e]" />
              Official Audit Log & Citizen Discussion ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-6 space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Log official note or citizen response..."
                className="w-full bg-white border border-[var(--border)] rounded-[2px] p-3 text-xs text-[var(--foreground)] placeholder-[#777777] focus:ring-1 focus:ring-[var(--primary)] outline-none h-20"
                required
              />
              {commentError && <p className="text-xs text-[var(--destructive)] font-bold">{commentError}</p>}
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="gov-btn-primary flex items-center gap-1.5 text-xs font-bold uppercase disabled:opacity-50"
                >
                  <Send size={12} /> Submit Entry
                </button>
              </div>
            </form>

            {/* Comment List */}
            <div className="space-y-4 border-t border-[var(--border)] pt-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-[2px]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-[var(--foreground)]">{comment.user?.full_name || 'Official Audit Participant'}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)] font-mono">{formatRelativeTime(comment.created_at)}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[var(--muted-foreground)] text-xs">
                  No public notes logged on this case file yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="gov-card p-5 space-y-4">
            <h3 className="font-bold text-xs text-[var(--foreground)] uppercase tracking-wider pb-2 border-b border-[var(--border)]">
              Docket File Metadata
            </h3>

            <div>
              <span className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">SLA Urgency Level</span>
              <span className="text-xs font-bold uppercase text-[var(--foreground)] font-mono bg-[var(--background)] border border-[var(--border)] px-2 py-1 inline-block">
                {issue.priority} Priority
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">Action Priority Score (APS)</span>
              <div className="text-xl font-bold font-mono text-[var(--foreground)] flex items-center gap-1">
                <Award size={18} /> {typeof issue.action_priority_score === 'number' ? issue.action_priority_score.toFixed(1) : (issue.action_priority_score || 0)}
              </div>
            </div>

            {issue.status !== 'resolved' && issue.status !== 'verified' && (
              <div>
                <span className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">Mandatory SLA Clock</span>
                <div className="p-3 bg-[#fee2e2] border border-[#b91c1c] text-[#991b1b] rounded-[2px] font-mono text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{!slaRemaining.expired ? slaRemaining.label : 'SLA DEADLINE EXPIRED'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="gov-card overflow-hidden">
            <div className="p-3 bg-[var(--card)] border-b border-[var(--border)] flex justify-between items-center text-xs font-bold text-[var(--foreground)] uppercase">
              <span>Geospatial GIS Map</span>
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{issue.ward}</span>
            </div>
            <div className="h-60 w-full">
              <IssueLocationMap lat={issue.latitude} lng={issue.longitude} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
