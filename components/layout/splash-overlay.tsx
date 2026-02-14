'use client';

import { useEffect } from 'react';

const SPLASH_SESSION_KEY = 'socialflow_splash_seen_v2';
const SPLASH_SHOW_MS = 1400;
const SPLASH_EXIT_MS = 450;

export function SplashOverlay() {
  useEffect(() => {
    const root = document.documentElement;
    const bootEnabled = root.dataset.bootSplash === '1';
    if (!bootEnabled) return;

    const bootSplash = document.querySelector<HTMLElement>('.boot-splash');
    if (!bootSplash) {
      // Nothing to animate, but still mark the session as seen.
      try {
        window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
      } catch {
        // ignore storage failures
      }
      delete root.dataset.bootSplash;
      return;
    }

    const exitTimer = window.setTimeout(() => {
      bootSplash.classList.add('splash-overlay--exit');
    }, SPLASH_SHOW_MS);

    const hideTimer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
      } catch {
        // ignore storage failures
      }
      delete root.dataset.bootSplash;
      bootSplash.remove();
    }, SPLASH_SHOW_MS + SPLASH_EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
