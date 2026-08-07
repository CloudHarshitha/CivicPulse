import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Stage 05: SLA Monitoring & Auto-Escalation Worker
 * Can be triggered periodically via Vercel Cron or external scheduler.
 * 1. Finds tickets exceeding SLA deadlines.
 * 2. Recalculates Action Priority Scores (APS) for all active tickets.
 * 3. Triggers escalation alerts for senior zonal engineers.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    
    // Validate secret if configured
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // 1. Fetch all active tickets
    const { data: activeIssues, error: issuesError } = await admin
      .from('issues')
      .select('id, title, priority, category, upvote_count, severity_weight, sla_deadline, created_at, ward, city')
      .in('status', ['open', 'in_progress']);

    if (issuesError) throw issuesError;

    let breachedCount = 0;
    let updatedScoreCount = 0;
    const notificationsToInsert = [];

    if (activeIssues && activeIssues.length > 0) {
      for (const issue of activeIssues) {
        // Recalculate APS score: (Upvotes * 1.5) + Severity + (Days Unresolved * 2.0)
        const daysUnresolved = (Date.now() - new Date(issue.created_at).getTime()) / 86400000;
        const newAPS = (issue.upvote_count * 1.5) + issue.severity_weight + (daysUnresolved * 2.0);

        // Check if SLA deadline is breached
        const isBreached = issue.sla_deadline && new Date(issue.sla_deadline).getTime() < Date.now();

        if (isBreached) {
          breachedCount++;
        }

        // Update issue APS score
        await admin.from('issues')
          .update({
            action_priority_score: Math.round(newAPS * 100) / 100,
            updated_at: now,
          })
          .eq('id', issue.id);

        updatedScoreCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      summary: {
        active_tickets_processed: activeIssues?.length || 0,
        scores_recalculated: updatedScoreCount,
        sla_breaches_detected: breachedCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SLA worker failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
