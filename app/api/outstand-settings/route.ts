import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import {
  ALL_OUTSTAND_PLATFORM_IDS,
  getOutstandUserSettings,
  upsertOutstandUserSettings,
} from '@/lib/outstand-user-settings';

export const runtime = 'nodejs';

const platformEnum = z.enum(ALL_OUTSTAND_PLATFORM_IDS as [string, ...string[]]);

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  tenantId: z.string().optional(),
  platforms: z.array(platformEnum).optional(),
  applyToAllAccounts: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getOutstandUserSettings(user.id);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[API] Outstand settings GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load Outstand settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const settings = await upsertOutstandUserSettings(user.id, parsed.data);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[API] Outstand settings PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save Outstand settings' }, { status: 500 });
  }
}
