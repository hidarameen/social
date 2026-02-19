import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashVerificationCode, isEmailVerificationEnabled, normalizeVerificationCode } from '@/lib/auth/email-verification';
import { createHash } from 'crypto';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const verifyTokenSchema = z.object({
  token: z.string().min(32).max(256),
});

const verifyCodeSchema = z.object({
  email: z.string().trim().email().max(255),
  code: z.string().min(4).max(20),
});

function hashTokenForLegacyLink(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`auth:verify-email:${getClientKey(request)}`, 10, 60_000);
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    if (!isEmailVerificationEnabled()) {
      return NextResponse.json({
        success: true,
        message: 'Email verification is currently disabled.',
      });
    }

    const payload = await request.json();
    const parsedToken = verifyTokenSchema.safeParse(payload);
    const parsedCode = verifyCodeSchema.safeParse(payload);

    let tokenHash = '';
    if (parsedToken.success) {
      tokenHash = hashTokenForLegacyLink(parsedToken.data.token.trim());
    } else if (parsedCode.success) {
      const email = parsedCode.data.email.toLowerCase().trim();
      const normalizedCode = normalizeVerificationCode(parsedCode.data.code);
      if (normalizedCode.length !== 6) {
        return NextResponse.json({ success: false, error: 'Invalid verification code.' }, { status: 400 });
      }
      const user = await db.getUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Verification code is invalid or expired.' },
          { status: 400 }
        );
      }
      tokenHash = hashVerificationCode(user.id, normalizedCode);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid verification payload.' }, { status: 400 });
    }

    const consumed = await db.consumeEmailVerificationToken(tokenHash);
    if (!consumed?.userId) {
      return NextResponse.json(
        { success: false, error: 'Verification code is invalid or expired.' },
        { status: 400 }
      );
    }

    const current = await db.getUser(consumed.userId);
    if (!current) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (!current.emailVerifiedAt) {
      await db.updateUser(current.id, { emailVerifiedAt: new Date() });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Verify email error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify email.' }, { status: 500 });
  }
}
