'use client';

import { AppLogo } from '@/components/common/app-logo';
import { cn } from '@/lib/utils';

type WaitingSplashProps = {
  active: boolean;
  title?: string;
  subtitle?: string;
  credit?: string;
  className?: string;
};

export function WaitingSplash({
  active,
  title = 'Please Wait',
  subtitle = 'Processing your request...',
  credit,
  className,
}: WaitingSplashProps) {
  if (!active) return null;

  return (
    <div className={cn('splash-overlay', className)} role="status" aria-live="polite" aria-busy="true">
      <div className="splash-overlay__glow" />
      <div className="splash-overlay__panel">
        <div className="splash-overlay__ring" />
        <div className="splash-overlay__logo">
          <AppLogo size={72} showText={false} variant="splash" splashSurface={false} className="!m-0" />
        </div>
        <h2 className="splash-overlay__title">{title}</h2>
        <p className="splash-overlay__subtitle">{subtitle}</p>
        {credit ? <p className="splash-overlay__credit">{credit}</p> : null}
      </div>
    </div>
  );
}
