import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppLogoVariant = 'image' | 'splash';

type AppLogoProps = {
  size?: number;
  showText?: boolean;
  text?: string;
  className?: string;
  textClassName?: string;
  badgeClassName?: string;
  variant?: AppLogoVariant;
  splashSurface?: boolean;
};

export function AppLogo({
  size = 30,
  showText = true,
  text = 'SocialFlow',
  className,
  textClassName,
  badgeClassName,
  variant = 'image',
  splashSurface = true,
}: AppLogoProps) {
  const iconSize = Math.max(16, Math.round(size * 0.6));
  const splashRadius = Math.max(12, Math.round(size * 0.305));
  const splashIconSize = Math.max(14, Math.round(size * 0.34));

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center',
          variant === 'image' ? 'rounded-xl border border-border/70 bg-card/80 shadow-sm' : '',
          badgeClassName
        )}
        style={
          variant === 'splash'
            ? {
                width: size,
                height: size,
                ...(splashSurface
                  ? {
                      borderRadius: splashRadius,
                      background:
                        'linear-gradient(160deg, color-mix(in oklch, var(--primary) 80%, white), color-mix(in oklch, var(--accent) 72%, white))',
                      color: 'color-mix(in oklch, var(--primary-foreground) 92%, black 8%)',
                      boxShadow: '0 18px 36px -20px color-mix(in oklch, var(--primary) 66%, transparent)',
                    }
                  : {
                      borderRadius: 0,
                      background: 'transparent',
                      color: 'color-mix(in oklch, var(--foreground) 88%, var(--primary) 12%)',
                      boxShadow: 'none',
                    }),
                animation: 'float-soft 3.8s ease-in-out infinite',
              }
            : { width: size, height: size }
        }
      >
        {variant === 'splash' ? (
          <Sparkles size={splashSurface ? splashIconSize : Math.max(splashIconSize + 6, Math.round(size * 0.44))} />
        ) : (
          <Image
            src="/icon.svg"
            alt="SocialFlow logo"
            width={iconSize}
            height={iconSize}
            className="h-auto w-auto object-contain"
            priority={false}
          />
        )}
      </span>
      {showText ? (
        <span className={cn('text-sm font-semibold tracking-tight text-foreground', textClassName)}>
          {text}
        </span>
      ) : null}
    </div>
  );
}
