'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Moon, ShieldCheck, Sparkles, Sun, Zap } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,color-mix(in_oklch,var(--primary)_20%,transparent),transparent_38%),radial-gradient(circle_at_85%_15%,color-mix(in_oklch,var(--accent)_16%,transparent),transparent_38%),radial-gradient(circle_at_70%_85%,color-mix(in_oklch,var(--secondary)_14%,transparent),transparent_34%)]" />
      <div
        className="absolute top-6 z-20 flex items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1 backdrop-blur-md"
        style={{ insetInlineEnd: '1.5rem' }}
      >
        <LanguageToggle compact />
        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
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
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <section className="absolute left-[-110px] top-1/2 hidden w-[360px] -translate-y-1/2 rounded-3xl border border-border/70 bg-card/55 p-8 shadow-2xl backdrop-blur-md xl:block">
          <AppLogo
            size={34}
            text="SocialFlow Orbit"
            className="mb-4"
            textClassName="text-base font-semibold"
            variant={logoVariant}
          />
          <p className="kpi-pill mb-4 inline-flex gap-2">
            <Sparkles size={12} />
            {t('auth.identity', 'SocialFlow Identity')}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            {t('auth.secureAccessTitle', 'Secure access to your automation workspace')}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t(
              'auth.secureAccessDescription',
              'Built for operators managing high-volume cross-platform workflows with enterprise-grade account protection.'
            )}
          </p>
          <div className="mt-8 grid gap-3">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck size={14} className="text-primary" />
                {t('auth.verificationTitle', 'Verification First')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'auth.verificationDescription',
                  'Email verification protects account ownership from day one.'
                )}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Zap size={14} className="text-primary" />
                {t('auth.sessionTitle', 'Fast Session Access')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'auth.sessionDescription',
                  'Smart sign-in experience with callback routing and quick recovery flows.'
                )}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <BadgeCheck size={14} className="text-primary" />
                {t('auth.uxTitle', 'Role-ready UX')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'auth.uxDescription',
                  'Optimized for keyboard navigation, validation clarity, and accessibility.'
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <Card className="border-border/75 bg-card/85 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-3 text-center">
              <div className="flex justify-center">
                <AppLogo size={logoSize} showText={logoShowText} className="mb-1" variant={logoVariant} />
              </div>
              <CardTitle className="text-3xl tracking-tight">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
