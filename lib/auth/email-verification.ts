import { createHash, randomInt } from 'crypto';
import type { NextRequest } from 'next/server';

const DEFAULT_VERIFY_CODE_TTL_MINUTES = 15;
const EMAIL_VERIFICATION_DISABLED_VALUES = new Set(['0', 'false', 'off', 'no', 'disabled']);

export function isEmailVerificationEnabled(): boolean {
  const raw = String(process.env.EMAIL_VERIFICATION_ENABLED ?? 'true')
    .trim()
    .toLowerCase();
  if (!raw) return true;
  return !EMAIL_VERIFICATION_DISABLED_VALUES.has(raw);
}

export function createVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function normalizeVerificationCode(input: string): string {
  return String(input || '')
    .replace(/\D/g, '')
    .slice(0, 6);
}

export function hashVerificationCode(userId: string, code: string): string {
  return createHash('sha256').update(`${userId}:${normalizeVerificationCode(code)}`).digest('hex');
}

export function getVerificationCodeTtlMinutes(): number {
  const raw = Number(process.env.EMAIL_VERIFY_CODE_TTL_MINUTES || '');
  if (!Number.isFinite(raw)) return DEFAULT_VERIFY_CODE_TTL_MINUTES;
  return Math.max(5, Math.min(60, Math.floor(raw)));
}

export function getVerificationCodeExpiresAt(): Date {
  const minutes = getVerificationCodeTtlMinutes();
  return new Date(Date.now() + minutes * 60_000);
}

export function buildVerificationUrl(request: NextRequest, email: string, code: string): string {
  const origin = request.nextUrl.origin;
  return `${origin}/verify-email?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
}
