import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import {
  buildVerificationUrl,
  createVerificationCode,
  getVerificationCodeExpiresAt,
  getVerificationCodeTtlMinutes,
  hashVerificationCode,
  isEmailVerificationEnabled,
} from '@/lib/auth/email-verification';
import { isEmailDeliveryConfigured, sendVerificationEmail } from '@/lib/email/mailer';

export const runtime = 'nodejs';

const resendSchema = z.object({
  email: z.string().trim().email().max(255),
});

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`auth:resend-verification:${getClientKey(request)}`, 8, 60_000);
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    if (!isEmailVerificationEnabled()) {
      return NextResponse.json({
        success: true,
        message: 'Email verification is currently disabled.',
      });
    }

    const parsed = resendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid email.' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.getUserByEmail(email);
    if (!user || user.emailVerifiedAt) {
      return NextResponse.json({
        success: true,
        message: 'If the account exists, a verification code has been sent.',
      });
    }

    const verificationCode = createVerificationCode();
    const verificationTokenHash = hashVerificationCode(user.id, verificationCode);
    await db.createEmailVerificationToken(
      user.id,
      verificationTokenHash,
      getVerificationCodeExpiresAt()
    );

    const verificationUrl = buildVerificationUrl(request, user.email, verificationCode);
    const expiresInMinutes = getVerificationCodeTtlMinutes();
    let emailDelivery = 'sent';

    try {
      await sendVerificationEmail({
        to: user.email,
        recipientName: user.name,
        code: verificationCode,
        expiresInMinutes,
        verificationUrl,
      });
    } catch (emailError) {
      console.error('[auth] Failed to send resend verification email:', emailError);
      if (process.env.NODE_ENV === 'production' || isEmailDeliveryConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Unable to send verification email. Please try again.' },
          { status: 500 }
        );
      }
      emailDelivery = 'debug';
    }

    console.info('[auth] Verification resend prepared:', {
      userId: user.id,
      email: user.email,
      emailDelivery,
      expiresInMinutes,
    });

    return NextResponse.json({
      success: true,
      message: 'If the account exists, a verification code has been sent.',
      expiresInMinutes,
      ...(process.env.NODE_ENV !== 'production'
        ? { debug: { verificationCode, verificationUrl, emailDelivery } }
        : {}),
    });
  } catch (error) {
    console.error('[API] Resend verification error:', error);
    return NextResponse.json(
      {
        success: true,
        message: 'If the account exists, a verification code has been sent.',
      },
      { status: 200 }
    );
  }
}
