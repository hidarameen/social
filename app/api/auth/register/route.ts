import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { getPasswordPolicyError, hasStrongPassword } from '@/lib/auth/password-policy';
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

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`auth:register:${getClientKey(request)}`, 10, 60_000);
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }
    const schema = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(255),
      password: z.string().min(8).max(128),
    });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;
    if (!hasStrongPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error: getPasswordPolicyError(),
        },
        { status: 400 }
      );
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Unable to create account with provided details.' },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    const verificationEnabled = isEmailVerificationEnabled();
    let user;
    try {
      user = await db.createUser({
        id: randomUUID(),
        name,
        email,
        passwordHash,
        ...(verificationEnabled ? {} : { emailVerifiedAt: new Date() }),
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Unable to create account with provided details.' },
          { status: 409 }
        );
      }
      throw error;
    }

    if (!verificationEnabled) {
      console.info('[auth] Registration completed with email verification disabled:', {
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json(
        {
          success: true,
          user: { id: user.id, email: user.email, name: user.name },
          verificationRequired: false,
          message: 'Account created successfully. Email verification is currently disabled.',
        },
        { status: 201 }
      );
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
      console.error('[auth] Failed to send verification email during registration:', emailError);
      if (process.env.NODE_ENV === 'production' || isEmailDeliveryConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Unable to send verification email. Please try again.' },
          { status: 500 }
        );
      }
      emailDelivery = 'debug';
    }

    console.info('[auth] Verification code prepared for user registration:', {
      userId: user.id,
      email: user.email,
      emailDelivery,
      expiresInMinutes,
    });

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
        verificationRequired: true,
        message: 'Verification code sent. Check your inbox.',
        expiresInMinutes,
        ...(process.env.NODE_ENV !== 'production'
          ? { debug: { verificationCode, verificationUrl, emailDelivery } }
          : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Register error:', error);
    return NextResponse.json({ success: false, error: 'Failed to register' }, { status: 500 });
  }
}
