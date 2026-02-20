'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { OtpCodeInput } from '@/components/auth/otp-code-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function normalizeCode(value: string): string {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 6);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toCodeDigits(value: string): string[] {
  const digits = normalizeCode(value);
  return Array.from({ length: 6 }, (_, index) => digits[index] || '');
}

type VerifyEmailPageClientProps = {
  token?: string;
  queryEmail?: string;
  queryCode?: string;
};

export default function VerifyEmailPageClient({ token, queryEmail, queryCode }: VerifyEmailPageClientProps) {
  const normalizedToken = String(token || '').trim();
  const normalizedQueryEmail = String(queryEmail || '').trim().toLowerCase();
  const normalizedQueryCode = normalizeCode(queryCode || '');
  const [email, setEmail] = useState(normalizedQueryEmail);
  const [codeDigits, setCodeDigits] = useState(() => toCodeDigits(normalizedQueryCode));
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(normalizedToken ? 'loading' : 'idle');
  const [message, setMessage] = useState(
    normalizedToken ? 'Verifying your email...' : 'Enter your email and 6-digit verification code.'
  );
  const [autoCodeAttempted, setAutoCodeAttempted] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const code = useMemo(() => codeDigits.join(''), [codeDigits]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(() => setResendTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const submitVerification = async (payload: Record<string, string>) => {
    setState('loading');
    setMessage('Verifying your email...');
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'Verification failed.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function verifyByToken() {
      if (!normalizedToken) return;
      try {
        await submitVerification({ token: normalizedToken });
        if (!cancelled) {
          setState('success');
          setMessage('Your email has been verified successfully.');
        }
      } catch (error) {
        if (!cancelled) {
          setState('error');
          setMessage(error instanceof Error ? error.message : 'Verification failed.');
        }
      }
    }
    void verifyByToken();
    return () => {
      cancelled = true;
    };
  }, [normalizedToken]);

  useEffect(() => {
    let cancelled = false;
    async function verifyByCodeFromQuery() {
      if (normalizedToken || autoCodeAttempted) return;
      if (!normalizedQueryEmail || normalizedQueryCode.length !== 6) return;
      setAutoCodeAttempted(true);
      try {
        await submitVerification({ email: normalizedQueryEmail, code: normalizedQueryCode });
        if (!cancelled) {
          setState('success');
          setMessage('Your email has been verified successfully.');
        }
      } catch (error) {
        if (!cancelled) {
          setState('error');
          setMessage(error instanceof Error ? error.message : 'Verification failed.');
        }
      }
    }
    void verifyByCodeFromQuery();
    return () => {
      cancelled = true;
    };
  }, [autoCodeAttempted, normalizedQueryCode, normalizedQueryEmail, normalizedToken]);

  const onSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code;

    if (!isValidEmail(normalizedEmail)) {
      setState('error');
      setMessage('Enter a valid email address.');
      return;
    }
    if (normalizedCode.length !== 6) {
      setState('error');
      setMessage('Enter the 6-digit verification code.');
      return;
    }

    try {
      await submitVerification({ email: normalizedEmail, code: normalizedCode });
      setState('success');
      setMessage('Your email has been verified successfully.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed.');
    }
  };

  const resendCode = async () => {
    if (resending || resendTimer > 0) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setState('error');
      setMessage('Enter your email first to resend the code.');
      return;
    }

    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Unable to resend verification code.');
      }
      setState('idle');
      setMessage(data?.message || 'Verification code sent.');
      setCodeDigits(Array(6).fill(''));
      setResendTimer(60);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell title="Email Verification" description="Confirm your account with the verification code.">
      <div className="space-y-5">
        <p className="text-sm text-foreground" aria-live="polite">
          {message}
        </p>

        {state === 'success' ? (
          <Link href="/login?verified=1" className="block">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        ) : (
          <form onSubmit={onSubmitCode} className="space-y-4">
            {!normalizedToken ? (
              <div className="space-y-2">
                <Label htmlFor="verify-email-address">Email</Label>
                <Input
                  id="verify-email-address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={state === 'loading'}
                  required
                />
              </div>
            ) : null}

            {!normalizedToken ? (
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <OtpCodeInput
                  value={codeDigits}
                  onChange={setCodeDigits}
                  invalid={state === 'error' && code.length > 0}
                  disabled={state === 'loading'}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <p>{resendTimer > 0 ? `Resend available in ${resendTimer}s` : 'Did not receive the code?'}</p>
                  <button
                    type="button"
                    onClick={() => void resendCode()}
                    className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                    disabled={resending || resendTimer > 0 || state === 'loading'}
                  >
                    {resending ? 'Resending...' : 'Resend code'}
                  </button>
                </div>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={state === 'loading'}>
              {state === 'loading' ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
