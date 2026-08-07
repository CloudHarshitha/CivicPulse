import { IssueCategory, IssuePriority } from '@/types';

/**
 * SLA configuration based on category and priority
 * Critical safety hazards: 24-hour SLA
 * Standard issues: 7-day SLA
 */

interface SLAConfig {
  hours: number;
  label: string;
}

const SLA_MATRIX: Record<IssuePriority, Record<IssueCategory, SLAConfig>> = {
  critical: {
    roads: { hours: 24, label: '24 Hours' },
    sanitation: { hours: 24, label: '24 Hours' },
    electricity: { hours: 24, label: '24 Hours' },
    water_sewage: { hours: 24, label: '24 Hours' },
    other: { hours: 48, label: '48 Hours' },
  },
  medium: {
    roads: { hours: 168, label: '7 Days' },
    sanitation: { hours: 120, label: '5 Days' },
    electricity: { hours: 72, label: '3 Days' },
    water_sewage: { hours: 72, label: '3 Days' },
    other: { hours: 168, label: '7 Days' },
  },
  low: {
    roads: { hours: 336, label: '14 Days' },
    sanitation: { hours: 240, label: '10 Days' },
    electricity: { hours: 168, label: '7 Days' },
    water_sewage: { hours: 168, label: '7 Days' },
    other: { hours: 336, label: '14 Days' },
  },
};

/**
 * Get SLA deadline for an issue
 */
export function getSLADeadline(priority: IssuePriority, category: IssueCategory, createdAt: string): Date {
  const config = SLA_MATRIX[priority]?.[category] || { hours: 168 };
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + config.hours);
  return deadline;
}

/**
 * Get SLA config
 */
export function getSLAConfig(priority: IssuePriority, category: IssueCategory): SLAConfig {
  return SLA_MATRIX[priority]?.[category] || { hours: 168, label: '7 Days' };
}

/**
 * Calculate remaining SLA time
 */
export function getSLARemaining(deadline: string | null): {
  expired: boolean;
  hours: number;
  minutes: number;
  label: string;
  urgency: 'normal' | 'warning' | 'critical' | 'expired';
} {
  if (!deadline) return { expired: false, hours: 0, minutes: 0, label: 'No SLA', urgency: 'normal' };

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    const overHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    return {
      expired: true,
      hours: overHours,
      minutes: 0,
      label: `Overdue by ${overHours}h`,
      urgency: 'expired',
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let urgency: 'normal' | 'warning' | 'critical' = 'normal';
  if (hours < 6) urgency = 'critical';
  else if (hours < 24) urgency = 'warning';

  let label = '';
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    label = `${days}d ${remHours}h remaining`;
  } else {
    label = `${hours}h ${minutes}m remaining`;
  }

  return { expired: false, hours, minutes, label, urgency };
}

/**
 * Department routing based on category
 */
export function getDepartmentForCategory(category: IssueCategory): string {
  switch (category) {
    case 'roads': return 'National Highways Authority / City Corporation Engineering';
    case 'sanitation': return 'Municipal Sanitation Division';
    case 'electricity': return 'City Electricity Board';
    case 'water_sewage': return 'Water & Sewage Authority';
    case 'other': return 'Municipal Corporation General';
    default: return 'Municipal Corporation General';
  }
}
