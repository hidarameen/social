import { NextRequest, NextResponse } from 'next/server';
import { ensureTwitterStreamStarted } from '@/lib/services/twitter-stream';
import { getAuthUser } from '@/lib/auth';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`twitter:stream:sync:${getClientKey(request)}`, 5, 60_000);
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await ensureTwitterStreamStarted();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Stream sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sync stream' },
      { status: 500 }
    );
  }
}
