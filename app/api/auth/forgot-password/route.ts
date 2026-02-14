import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import {
  buildPasswordResetUrl,
  createPasswordResetCode,
  getPasswordResetCodeExpiresAt,
  getPasswordResetCodeTtlMinutes,
  hashPasswordResetCode,
} from '@/lib/auth/password-reset';
import { isEmailDeliveryConfigured, sendPasswordResetEmail } from '@/lib/email/mailer';

export const runtime = 'nodejs';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
});

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`auth:forgot-password:${getClientKey(request)}`, 8, 60_000);
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid email.' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.getUserByEmailWithPassword(email);
    if (!user?.passwordHash) {
      return NextResponse.json({
        success: true,
        message: 'If the account exists, a reset code has been sent.',
      });
    }

    const resetCode = createPasswordResetCode();
    const resetTokenHash = hashPasswordResetCode(user.id, resetCode);
    await db.createPasswordResetToken(
      user.id,
      resetTokenHash,
      getPasswordResetCodeExpiresAt()
    );

    const resetUrl = buildPasswordResetUrl(request, user.email, resetCode);
    const expiresInMinutes = getPasswordResetCodeTtlMinutes();
    let emailDelivery = 'sent';

    try {
      await sendPasswordResetEmail({
        to: user.email,
        recipientName: user.name,
        code: resetCode,
        expiresInMinutes,
        resetUrl,
      });
    } catch (emailError) {
      console.error('[auth] Failed to send password reset email:', emailError);
      if (process.env.NODE_ENV === 'production' || isEmailDeliveryConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Unable to send reset code. Please try again.' },
          { status: 500 }
        );
      }
      emailDelivery = 'debug';
    }

    console.info('[auth] Password reset code prepared:', {
      userId: user.id,
      email: user.email,
      expiresInMinutes,
      emailDelivery,
    });

    return NextResponse.json({
      success: true,
      message: 'If the account exists, a reset code has been sent.',
      expiresInMinutes,
      ...(process.env.NODE_ENV !== 'production'
        ? { debug: { resetCode, resetUrl, emailDelivery } }
        : {}),
    });
  } catch (error) {
    console.error('[API] Forgot password error:', error);
    return NextResponse.json({
      success: true,
      message: 'If the account exists, a reset code has been sent.',
    });
  }
}
