'use client';

import { useEffect, useMemo, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

type OtpCodeInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
  className?: string;
};

function normalizeDigit(input: string): string {
  return String(input || '').replace(/\D/g, '').slice(-1);
}

export function OtpCodeInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  invalid = false,
  autoFocus = true,
  onComplete,
  className,
}: OtpCodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const base = Array.from({ length }, (_, index) => value[index] || '');
    return base;
  }, [length, value]);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const timeout = window.setTimeout(() => refs.current[0]?.focus(), 20);
    return () => window.clearTimeout(timeout);
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (!onComplete) return;
    const completed = digits.every((item) => item.length === 1);
    if (completed) onComplete(digits.join(''));
  }, [digits, onComplete]);

  const emit = (next: string[]) => {
    onChange(next.slice(0, length));
  };

  const handleInputChange = (index: number, rawValue: string) => {
    const digit = normalizeDigit(rawValue);
    const next = [...digits];
    next[index] = digit;
    emit(next);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
      refs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
      return;
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array.from({ length }, (_, index) => pasted[index] || '');
    emit(next);
    const lastIndex = Math.max(0, pasted.length - 1);
    refs.current[lastIndex]?.focus();
  };

  return (
    <div className={cn('flex items-center justify-between gap-2 sm:gap-3', className)} onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          className={cn(
            'h-12 w-11 rounded-xl border bg-background/85 text-center text-lg font-semibold text-foreground shadow-sm outline-none transition-all sm:h-14 sm:w-12',
            'focus:border-primary/55 focus:ring-4 focus:ring-primary/18',
            invalid ? 'border-destructive/55 ring-2 ring-destructive/15' : 'border-border/75',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          aria-label={`Code digit ${index + 1}`}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleInputChange(index, event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => handleKeyDown(index, event)}
        />
      ))}
    </div>
  );
}
