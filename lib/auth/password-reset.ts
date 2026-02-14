import { createHash, randomInt } from 'crypto';
import type { NextRequest } from 'next/server';

const DEFAULT_RESET_CODE_TTL_MINUTES = 15;

export function createPasswordResetCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function normalizePasswordResetCode(input: string): string {
  return String(input || '')
    .replace(/\D/g, '')
    .slice(0, 6);
}

export function hashPasswordResetCode(userId: string, code: string): string {
  return createHash('sha256').update(`${userId}:${normalizePasswordResetCode(code)}`).digest('hex');
}

export function getPasswordResetCodeTtlMinutes(): number {
  const raw = Number(process.env.EMAIL_RESET_CODE_TTL_MINUTES || '');
  if (!Number.isFinite(raw)) return DEFAULT_RESET_CODE_TTL_MINUTES;
  return Math.max(5, Math.min(60, Math.floor(raw)));
}

export function getPasswordResetCodeExpiresAt(): Date {
  const minutes = getPasswordResetCodeTtlMinutes();
  return new Date(Date.now() + minutes * 60_000);
}

export function buildPasswordResetUrl(request: NextRequest, email: string, code: string): string {
  const origin = request.nextUrl.origin;
  return `${origin}/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
}
