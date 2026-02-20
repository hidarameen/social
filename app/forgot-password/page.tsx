'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Eye, EyeOff, Lock, Mail, RotateCw } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { OtpCodeInput } from '@/components/auth/otp-code-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { id: 'number', label: 'One number', test: (value: string) => /[0-9]/.test(value) },
  { id: 'special', label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'verify' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [debugResetCode, setDebugResetCode] = useState('');
  const [debugResetUrl, setDebugResetUrl] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const passwordChecks = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        ...rule,
        pass: rule.test(password),
      })),
    [password]
  );
  const meetsPasswordPolicy = passwordChecks.every((rule) => rule.pass);
  const code = codeDigits.join('');

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(() => setResendTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const requestCode = async (normalizedEmail: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'Unable to process request.');
    }
    return data as {
      message?: string;
      debug?: {
        resetCode?: string;
        resetUrl?: string;
      };
    };
  };

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    flushSync(() => setSubmitting(true));
    try {
      const data = await requestCode(normalizedEmail);
      setEmail(normalizedEmail);
      setCodeDigits(Array(6).fill(''));
      setPassword('');
      setConfirmPassword('');
      setMessage(data?.message || 'A reset code was sent to your email.');
      setDebugResetCode(data?.debug?.resetCode || '');
      setDebugResetUrl(data?.debug?.resetUrl || '');
      setResendTimer(60);
      setStep('verify');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to process request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resending || resendTimer > 0) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    flushSync(() => setResending(true));
    setError('');
    setMessage('');
    try {
      const data = await requestCode(normalizedEmail);
      setCodeDigits(Array(6).fill(''));
      setMessage(data?.message || 'A new reset code was sent.');
      setDebugResetCode(data?.debug?.resetCode || debugResetCode);
      setDebugResetUrl(data?.debug?.resetUrl || debugResetUrl);
      setResendTimer(60);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleConfirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (code.length !== 6) {
      setError('Enter the 6-digit reset code.');
      return;
    }
    if (!meetsPasswordPolicy) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    flushSync(() => setSubmitting(true));
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          code,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Unable to reset password.');
      }

      setPassword('');
      setConfirmPassword('');
      setCodeDigits(Array(6).fill(''));
      setStep('done');
      setMessage('Password updated successfully. You can sign in now.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={step === 'request' ? 'Forgot Password' : step === 'verify' ? 'Verify & Reset' : 'Password Updated'}
      description={
        step === 'request'
          ? 'Enter your email and we will send a verification code.'
          : step === 'verify'
            ? 'Enter the code we sent to your email, then set a new password.'
            : 'Your password has been changed successfully.'
      }
      logoSize={86}
      logoShowText={false}
    >
      {step === 'request' ? (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="forgot-password-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(error)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div aria-live="polite" className="space-y-2">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {message ? <p className="text-sm text-foreground">{message}</p> : null}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Reset Code'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Back to Sign In
            </Link>
          </p>
        </form>
      ) : null}

      {step === 'verify' ? (
        <form onSubmit={handleConfirmReset} className="space-y-5">
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary/95">
            A verification code was sent to <span className="font-semibold">{email}</span>.
          </div>

          <div className="space-y-2">
            <Label>Verification Code</Label>
            <OtpCodeInput
              value={codeDigits}
              onChange={setCodeDigits}
              invalid={Boolean(error) && code.length > 0 && code.length < 6}
              disabled={submitting}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>{resendTimer > 0 ? `Resend available in ${resendTimer}s` : 'Did not receive the code?'}</p>
              <button
                type="button"
                onClick={() => void handleResendCode()}
                className="inline-flex items-center gap-1 text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                disabled={resendTimer > 0 || resending}
              >
                <RotateCw className="h-3.5 w-3.5" />
                {resending ? 'Resending...' : 'Resend'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgot-password-new">New Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="forgot-password-new"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className="pl-9 pr-11"
                disabled={submitting}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={submitting}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </Button>
            </div>
            <ul className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {passwordChecks.map((rule) => (
                <li key={rule.id} className={rule.pass ? 'text-primary' : ''}>
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgot-password-confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="forgot-password-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                className="pl-9 pr-11"
                disabled={submitting}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={submitting}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </Button>
            </div>
          </div>

          <div aria-live="polite" className="space-y-2">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {message ? <p className="text-sm text-foreground">{message}</p> : null}
          </div>

          {(debugResetCode || debugResetUrl) && (
            <div className="rounded-xl border border-border/70 bg-muted/35 p-3 text-xs text-muted-foreground">
              <p className="mb-2 font-semibold text-foreground">Development reset details:</p>
              {debugResetCode ? (
                <p className="mb-2">
                  Code: <span className="font-semibold text-foreground">{debugResetCode}</span>
                </p>
              ) : null}
              {debugResetUrl ? (
                <a href={debugResetUrl} className="break-all text-primary underline" target="_blank" rel="noreferrer">
                  {debugResetUrl}
                </a>
              ) : null}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Updating...' : 'Confirm & Update Password'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setStep('request');
                setCodeDigits(Array(6).fill(''));
                setPassword('');
                setConfirmPassword('');
                setError('');
                setMessage('');
              }}
            >
              Use another email
            </button>
          </p>
        </form>
      ) : null}

      {step === 'done' ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground">{message || 'Password updated successfully. You can sign in now.'}</p>
          <Link href="/login?reset=1" className="block">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        </div>
      ) : null}
    </AuthShell>
  );
}
