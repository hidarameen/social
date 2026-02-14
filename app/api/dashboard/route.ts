import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { parsePagination } from '@/lib/validation';

export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const page = parsePagination(request.nextUrl.searchParams);
    if (!page.success) {
      return NextResponse.json({ success: false, error: 'Invalid pagination' }, { status: 400 });
    }

    const listLimit = Math.min(page.data.limit, 50);

    const [tasks, activeTasks, accounts, executionTotals, recentExecutions] = await Promise.all([
      db.getUserTasksPaged({
        userId: user.id,
        limit: listLimit,
        offset: 0,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
      db.getUserTasksPaged({
        userId: user.id,
        limit: 1,
        offset: 0,
        status: 'active',
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
      db.getUserAccountsPaged({
        userId: user.id,
        limit: 1,
        offset: 0,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
      db.getExecutionTotalsForUser(user.id),
      db.getExecutionsForUserPaged({
        userId: user.id,
        limit: 5,
        offset: 0,
        sortBy: 'executedAt',
        sortDir: 'desc',
      }),
    ]);

    const recentTasks = tasks.tasks.slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        totalTasks: tasks.total,
        totalAccounts: accounts.total,
        activeTasksCount: activeTasks.total,
        totalExecutions: executionTotals.total,
      },
      recentTasks,
      recentExecutions: recentExecutions.executions,
    });
  } catch (error) {
    console.error('[API] Error fetching dashboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
