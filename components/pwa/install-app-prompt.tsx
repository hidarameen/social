'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const HIDDEN_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

export function InstallAppPrompt() {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () => {
      const iosStandalone =
        typeof (window.navigator as Navigator & { standalone?: boolean }).standalone === 'boolean'
          ? Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
          : false;
      setIsStandalone(mediaQuery.matches || iosStandalone);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
      toast.success('SocialFlow was installed successfully');
    };

    updateStandalone();
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    mediaQuery.addEventListener('change', updateStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      mediaQuery.removeEventListener('change', updateStandalone);
    };
  }, []);

  const shouldHide = useMemo(() => HIDDEN_ROUTES.has(pathname || '/'), [pathname]);

  if (shouldHide || isStandalone || !installEvent) {
    return null;
  }

  return (
    <div className="fixed left-3 z-40 bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:left-5 sm:bottom-5">
      <Button
        size="sm"
        className="rounded-xl shadow-lg"
        disabled={isPrompting}
        onClick={async () => {
          setIsPrompting(true);
          try {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            if (choice.outcome === 'accepted') {
              setInstallEvent(null);
            }
          } catch (error) {
            console.error('[PWA] install prompt failed:', error);
          } finally {
            setIsPrompting(false);
          }
        }}
      >
        <Download size={14} />
        Install App
      </Button>
    </div>
  );
}
