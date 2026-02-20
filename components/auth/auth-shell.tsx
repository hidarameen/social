'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Moon, Network, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { AppLogo } from '@/components/common/app-logo';
import { useLanguage } from '@/components/i18n/language-provider';
import { LanguageToggle } from '@/components/i18n/language-toggle';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  logoSize?: number;
  logoShowText?: boolean;
  logoVariant?: 'image' | 'splash';
};

export function AuthShell({
  title,
  description,
  children,
  logoSize = 30,
  logoShowText = true,
  logoVariant = 'splash',
}: AuthShellProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTheme = useMemo(
    () => (mounted && resolvedTheme === 'dark' ? 'dark' : 'light'),
    [mounted, resolvedTheme]
  );
  const nextTheme = selectedTheme === 'dark' ? 'light' : 'dark';

  return (
    <div className="auth-shell relative min-h-screen overflow-hidden bg-background">
      <div className="auth-shell-backdrop pointer-events-none absolute inset-0" />
      <div className="auth-shell-grid pointer-events-none absolute inset-0" />
      <div className="auth-blob auth-blob--primary" />
      <div className="auth-blob auth-blob--secondary" />
      <div
        className="absolute top-5 z-20 flex items-center gap-1.5 rounded-full border border-border/75 bg-card/75 p-1 backdrop-blur-xl"
        style={{ insetInlineEnd: '1.5rem' }}
      >
        <LanguageToggle compact />
        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:opacity-95"
          aria-label={
            selectedTheme === 'dark'
              ? t('auth.themeLight', 'Light mode')
              : t('auth.themeDark', 'Dark mode')
          }
          title={
            selectedTheme === 'dark'
              ? t('auth.themeLight', 'Light mode')
              : t('auth.themeDark', 'Dark mode')
          }
        >
          {selectedTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)]">
        <section className="auth-showcase hidden lg:block">
          <div className="auth-showcase-card">
            <AppLogo
              size={38}
              text="SocialFlow Orbit"
              className="mb-4"
              textClassName="text-base font-semibold"
              variant={logoVariant}
            />
            <p className="kpi-pill mb-5 inline-flex gap-2">
              <Sparkles size={12} />
              {t('auth.identity', 'SocialFlow Identity')}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground">
              {t('auth.secureAccessTitle', 'Secure access to your automation workspace')}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t(
                'auth.secureAccessDescription',
                'Built for operators managing high-volume cross-platform workflows with enterprise-grade account protection.'
              )}
            </p>

            <div className="mt-6 rounded-2xl border border-border/70 bg-background/70 p-4">
              <svg
                viewBox="0 0 560 220"
                className="h-auto w-full text-primary/85"
                role="img"
                aria-label="Workflow network illustration"
              >
                <defs>
                  <linearGradient id="auth-illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.75" />
                  </linearGradient>
                </defs>
                <g fill="none" stroke="url(#auth-illustration-gradient)" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M52 166 L188 120 L290 82 L414 126 L510 96" />
                  <path d="M52 82 L162 102 L278 56 L374 76 L510 152" />
                  <path d="M188 120 L188 54 M414 126 L414 58 M290 82 L290 162" />
                </g>
                <g fill="var(--card)" stroke="var(--primary)" strokeWidth="2">
                  <circle cx="52" cy="166" r="13" />
                  <circle cx="188" cy="120" r="13" />
                  <circle cx="290" cy="82" r="15" />
                  <circle cx="414" cy="126" r="13" />
                  <circle cx="510" cy="96" r="13" />
                  <circle cx="52" cy="82" r="13" />
                  <circle cx="162" cy="102" r="13" />
                  <circle cx="278" cy="56" r="13" />
                  <circle cx="374" cy="76" r="13" />
                  <circle cx="510" cy="152" r="13" />
                </g>
              </svg>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-xl border border-border/65 bg-card/65 p-3">
                <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck size={14} className="text-primary" />
                  {t('auth.verificationTitle', 'Verification First')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('auth.verificationDescription', 'Email verification protects account ownership from day one.')}
                </p>
              </div>
              <div className="rounded-xl border border-border/65 bg-card/65 p-3">
                <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Network size={14} className="text-primary" />
                  {t('auth.sessionTitle', 'Connected Workflows')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('auth.sessionDescription', 'Manage accounts, tasks, and automation securely from one workspace.')}
                </p>
              </div>
              <div className="rounded-xl border border-border/65 bg-card/65 p-3">
                <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BadgeCheck size={14} className="text-primary" />
                  {t('auth.uxTitle', 'Role-ready UX')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('auth.uxDescription', 'Accessible forms, keyboard support, and clear validation states.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <Card className="auth-card border-border/80 bg-card/78 shadow-2xl backdrop-blur-2xl">
            <CardHeader className="space-y-3 text-center">
              <div className="flex justify-center">
                <AppLogo size={logoSize} showText={logoShowText} className="mb-1" variant={logoVariant} />
              </div>
              <CardTitle className="text-3xl tracking-tight">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-1">{children}</CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
