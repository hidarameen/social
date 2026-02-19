import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { startTelegramUserAuth, verifyTelegramUserAuth } from '@/lib/telegram-user-auth';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const startSchema = z.object({
  action: z.literal('start'),
  phoneNumber: z.string().min(5),
});

const verifySchema = z.object({
  action: z.literal('verify'),
  authId: z.string().min(1),
  phoneCode: z.string().min(1),
  password: z.string().optional(),
});

const requestSchema = z.discriminatedUnion('action', [startSchema, verifySchema]);

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`telegram:auth:${getClientKey(request)}`, 12, 60_000);
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    if (parsed.data.action === 'start') {
      const started = await startTelegramUserAuth({
        userId: user.id,
        phoneNumber: parsed.data.phoneNumber,
      });
      return NextResponse.json({
        success: true,
        step: 'code_sent',
        ...started,
      });
    }

    const verified = await verifyTelegramUserAuth({
      userId: user.id,
      authId: parsed.data.authId,
      phoneCode: parsed.data.phoneCode,
      password: parsed.data.password,
    });

    if (!verified.success) {
      return NextResponse.json({
        success: true,
        step: 'password_required',
        requiresPassword: true,
        hint: verified.hint,
      });
    }

    return NextResponse.json({
      success: true,
      step: 'authorized',
      profile: verified.profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Telegram authentication failed',
      },
      { status: 400 }
    );
  }
}
