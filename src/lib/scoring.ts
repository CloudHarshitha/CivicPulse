import { IssuePriority } from '@/types';

/**
 * Calculate severity weight based on priority
 * Critical = 25, Medium = 10, Low = 5
 */
export function getSeverityWeight(priority: IssuePriority): number {
  switch (priority) {
    case 'critical': return 25;
    case 'medium': return 10;
    case 'low': return 5;
    default: return 5;
  }
}

/**
 * Calculate Action Priority Score (APS)
 * APS = (Upvote Count × 1.5) + (Severity Weight) + (Days Unresolved × 2.0)
 */
export function calculateAPS(
  upvoteCount: number,
  severityWeight: number,
  createdAt: string
): number {
  const daysUnresolved = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return (upvoteCount * 1.5) + severityWeight + (daysUnresolved * 2.0);
}

/**
 * Get priority color classes
 */
export function getPriorityColor(priority: IssuePriority): string {
  switch (priority) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'resolved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'verified': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'pending_verification': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Get category icon name and color
 */
export function getCategoryInfo(category: string): { icon: string; color: string; label: string } {
  switch (category) {
    case 'roads': return { icon: 'Construction', color: 'text-orange-400', label: 'Roads' };
    case 'sanitation': return { icon: 'Trash2', color: 'text-green-400', label: 'Sanitation' };
    case 'electricity': return { icon: 'Zap', color: 'text-yellow-400', label: 'Electricity' };
    case 'water_sewage': return { icon: 'Droplets', color: 'text-blue-400', label: 'Water & Sewage' };
    case 'other': return { icon: 'HelpCircle', color: 'text-gray-400', label: 'Other' };
    default: return { icon: 'HelpCircle', color: 'text-gray-400', label: category };
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Format distance in meters to human readable
 */
export function formatDistance(meters: number | null | undefined): string {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}
