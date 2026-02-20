'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { cn } from '@/lib/utils';

type SocialProvider = 'google' | 'apple';

type ProviderState = Record<SocialProvider, boolean>;

type SocialAuthButtonsProps = {
  callbackUrl?: string;
  className?: string;
  dividerLabel?: string;
  onError?: (message: string) => void;
};

const DEFAULT_PROVIDER_STATE: ProviderState = {
  google: false,
  apple: false,
};

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: 'Google',
  apple: 'Apple',
};

function GoogleBrandIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12.24 10.286v3.868h5.482c-.241 1.241-.965 2.293-2.05 2.998l3.312 2.57c1.93-1.777 3.044-4.391 3.044-7.488 0-.724-.065-1.42-.185-2.096h-9.603z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.76 0 5.077-.913 6.77-2.477l-3.312-2.57c-.913.614-2.08.978-3.458.978-2.662 0-4.923-1.799-5.733-4.214H2.86v2.651A10 10 0 0 0 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.267 13.717A5.99 5.99 0 0 1 5.946 12c0-.597.107-1.176.32-1.717V7.632H2.86A10 10 0 0 0 2 12c0 1.614.386 3.134 1.07 4.368l3.197-2.651z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.07c1.5 0 2.849.517 3.91 1.531l2.931-2.93C17.073 2.999 14.756 2 12 2A10 10 0 0 0 3.07 7.632l3.197 2.65C7.077 7.869 9.338 6.07 12 6.07z"
      />
    </svg>
  );
}

function AppleBrandIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M16.365 12.86c.025 2.485 2.177 3.313 2.201 3.323-.018.058-.343 1.176-1.128 2.33-.678.997-1.382 1.99-2.49 2.011-1.088.02-1.438-.646-2.684-.646-1.245 0-1.635.625-2.663.666-1.066.04-1.878-1.068-2.562-2.061-1.398-2.022-2.468-5.717-1.033-8.208.713-1.236 1.987-2.018 3.371-2.038 1.045-.02 2.032.706 2.684.706.651 0 1.872-.874 3.156-.746.538.022 2.05.218 3.019 1.634-.078.048-1.807 1.051-1.771 3.13zM14.688 5.102c.57-.689.954-1.647.848-2.602-.821.032-1.815.545-2.404 1.233-.528.609-.991 1.584-.866 2.52.916.071 1.853-.464 2.422-1.151z" />
    </svg>
  );
}

function getProviderIcon(provider: SocialProvider) {
  if (provider === 'google') return <GoogleBrandIcon />;
  return <AppleBrandIcon />;
}

export function SocialAuthButtons({
  callbackUrl,
  className,
  dividerLabel = 'Or continue with',
  onError,
}: SocialAuthButtonsProps) {
  const [providerState, setProviderState] = useState<ProviderState>(DEFAULT_PROVIDER_STATE);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProviders() {
      try {
        const res = await fetch('/api/auth/providers', { cache: 'no-store' });
        const data = await res.json();
        if (!active || !data || typeof data !== 'object') return;
        setProviderState({
          google: Boolean((data as Record<string, unknown>).google),
          apple: Boolean((data as Record<string, unknown>).apple),
        });
      } catch {
        if (active) {
          setProviderState(DEFAULT_PROVIDER_STATE);
        }
      } finally {
        if (active) setProvidersLoaded(true);
      }
    }
    void loadProviders();
    return () => {
      active = false;
    };
  }, []);

  const socialProviders = useMemo(() => ['google', 'apple'] as const, []);

  const startSocialAuth = async (provider: SocialProvider) => {
    if (loadingProvider) return;
    if (!providerState[provider]) {
      onError?.(`${PROVIDER_LABELS[provider]} sign in is not configured yet.`);
      return;
    }

    setLoadingProvider(provider);
    try {
      const response = await signIn(provider, {
        redirect: false,
        callbackUrl: callbackUrl || '/',
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (response?.url) {
        window.location.assign(response.url);
        return;
      }
      throw new Error('Unable to start social sign in.');
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unable to start social sign in.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/70" />
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{dividerLabel}</span>
        <div className="h-px flex-1 bg-border/70" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {socialProviders.map((provider) => {
          const isUnavailable = providersLoaded && !providerState[provider];
          const isLoading = loadingProvider === provider;
          return (
            <button
              key={provider}
              type="button"
              onClick={() => void startSocialAuth(provider)}
              disabled={Boolean(loadingProvider) || isUnavailable}
              className={cn(
                'auth-social-btn group',
                provider === 'apple' ? 'text-foreground' : 'text-foreground',
                isUnavailable && 'cursor-not-allowed opacity-55'
              )}
              title={
                isUnavailable
                  ? `${PROVIDER_LABELS[provider]} sign in is not configured.`
                  : `Sign in with ${PROVIDER_LABELS[provider]}`
              }
              aria-label={`Sign in with ${PROVIDER_LABELS[provider]}`}
            >
              <span className="inline-flex items-center justify-center">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : getProviderIcon(provider)}
              </span>
              <span className="font-medium">{PROVIDER_LABELS[provider]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
