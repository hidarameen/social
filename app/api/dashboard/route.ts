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

    const listLimit = Math.min(page.data.limit, 20);

    const [
      tasks,
      activeTasks,
      pausedTasks,
      erroredTasks,
      completedTasks,
      accounts,
      executionTotals,
      recentExecutions,
      topTaskStats,
    ] = await Promise.all([
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
      db.getUserTasksPaged({
        userId: user.id,
        limit: 1,
        offset: 0,
        status: 'paused',
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
      db.getUserTasksPaged({
        userId: user.id,
        limit: 1,
        offset: 0,
        status: 'error',
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
      db.getUserTasksPaged({
        userId: user.id,
        limit: 1,
        offset: 0,
        status: 'completed',
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
      db.getUserAccounts(user.id),
      db.getExecutionTotalsForUser(user.id),
      db.getExecutionsForUserPaged({
        userId: user.id,
        limit: 8,
        offset: 0,
        sortBy: 'executedAt',
        sortDir: 'desc',
      }),
      db.getTaskStatsForUser({
        userId: user.id,
        limit: 5,
        offset: 0,
        sortBy: 'successRate',
        sortDir: 'desc',
      }),
    ]);

    const recentTasks = tasks.tasks.slice(0, listLimit);
    const accountsById = Object.fromEntries(
      accounts.map((account) => [
        account.id,
        {
          id: account.id,
          platformId: account.platformId,
          accountName: account.accountName,
          accountUsername: account.accountUsername,
          isActive: account.isActive,
        },
      ])
    );
    const platformBreakdown = accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.platformId] = (acc[account.platformId] ?? 0) + 1;
      return acc;
    }, {});
    const activeAccounts = accounts.filter((account) => account.isActive).length;
    const inactiveAccounts = Math.max(0, accounts.length - activeAccounts);
    const executionSuccessRate =
      executionTotals.total > 0
        ? Math.round((executionTotals.successful / executionTotals.total) * 100)
        : 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalTasks: tasks.total,
        activeTasksCount: activeTasks.total,
        pausedTasksCount: pausedTasks.total,
        errorTasksCount: erroredTasks.total,
        completedTasksCount: completedTasks.total,
        totalAccounts: accounts.length,
        activeAccounts,
        inactiveAccounts,
        totalExecutions: executionTotals.total,
        successfulExecutions: executionTotals.successful,
        failedExecutions: executionTotals.failed,
        executionSuccessRate,
      },
      taskBreakdown: {
        active: activeTasks.total,
        paused: pausedTasks.total,
        error: erroredTasks.total,
        completed: completedTasks.total,
      },
      accountBreakdown: {
        total: accounts.length,
        active: activeAccounts,
        inactive: inactiveAccounts,
        byPlatform: platformBreakdown,
      },
      health: {
        hasFailures: executionTotals.failed > 0,
        hasAuthWarnings: inactiveAccounts > 0,
      },
      accountsById,
      recentTasks,
      recentExecutions: recentExecutions.executions,
      topTaskStats: topTaskStats.stats,
    });
  } catch (error) {
    console.error('[API] Error fetching dashboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
