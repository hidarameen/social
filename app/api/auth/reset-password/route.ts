import { createHash } from 'crypto';
import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { getPasswordPolicyError, hasStrongPassword } from '@/lib/auth/password-policy';
import { hashPasswordResetCode, normalizePasswordResetCode } from '@/lib/auth/password-reset';

export const runtime = 'nodejs';

const resetPasswordTokenSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(8).max(128),
});

const resetPasswordCodeSchema = z.object({
  email: z.string().trim().email().max(255),
  code: z.string().min(4).max(20),
  password: z.string().min(8).max(128),
});

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`auth:reset-password:${getClientKey(request)}`, 10, 60_000);
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const payload = await request.json();
    const parsedToken = resetPasswordTokenSchema.safeParse(payload);
    const parsedCode = resetPasswordCodeSchema.safeParse(payload);

    let tokenHash = '';
    let password = '';
    if (parsedToken.success) {
      tokenHash = hashToken(parsedToken.data.token);
      password = parsedToken.data.password;
    } else if (parsedCode.success) {
      const email = parsedCode.data.email.toLowerCase().trim();
      const normalizedCode = normalizePasswordResetCode(parsedCode.data.code);
      if (normalizedCode.length !== 6) {
        return NextResponse.json({ success: false, error: 'Invalid reset code.' }, { status: 400 });
      }
      const user = await db.getUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Reset code is invalid or expired.' },
          { status: 400 }
        );
      }
      tokenHash = hashPasswordResetCode(user.id, normalizedCode);
      password = parsedCode.data.password;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid input.' }, { status: 400 });
    }

    if (!hasStrongPassword(password)) {
      return NextResponse.json({ success: false, error: getPasswordPolicyError() }, { status: 400 });
    }

    const consumed = await db.consumePasswordResetToken(tokenHash);
    if (!consumed?.userId) {
      return NextResponse.json(
        { success: false, error: 'Reset code is invalid or expired.' },
        { status: 400 }
      );
    }

    const user = await db.getUser(consumed.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const passwordHash = await hash(password, 12);
    await db.updateUser(user.id, { passwordHash });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Reset password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset password.' }, { status: 500 });
  }
}
