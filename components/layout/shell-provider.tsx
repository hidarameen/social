'use client';

import * as React from 'react';

type DensityMode = 'comfortable' | 'compact';

type ShellContextValue = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  density: DensityMode;
  setDensity: (value: DensityMode) => void;
};

const SHELL_SIDEBAR_KEY = 'socialflow_shell_sidebar_collapsed_v1';
const SHELL_REDUCED_MOTION_KEY = 'socialflow_shell_reduced_motion_v1';
const SHELL_DENSITY_KEY = 'socialflow_shell_density_v1';

const ShellContext = React.createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [density, setDensity] = React.useState<DensityMode>('comfortable');

  React.useEffect(() => {
    try {
      const rawCollapsed = window.localStorage.getItem(SHELL_SIDEBAR_KEY);
      const rawReducedMotion = window.localStorage.getItem(SHELL_REDUCED_MOTION_KEY);
      const rawDensity = window.localStorage.getItem(SHELL_DENSITY_KEY);

      setSidebarCollapsed(rawCollapsed === '1');
      setReducedMotion(rawReducedMotion === '1');
      if (rawDensity === 'comfortable' || rawDensity === 'compact') {
        setDensity(rawDensity);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--shell-sidebar-width', sidebarCollapsed ? '5.5rem' : '18rem');
    root.setAttribute('data-density', density);
    root.setAttribute('data-reduced-motion', reducedMotion ? 'true' : 'false');

    try {
      window.localStorage.setItem(SHELL_SIDEBAR_KEY, sidebarCollapsed ? '1' : '0');
      window.localStorage.setItem(SHELL_REDUCED_MOTION_KEY, reducedMotion ? '1' : '0');
      window.localStorage.setItem(SHELL_DENSITY_KEY, density);
    } catch {
      // ignore storage failures
    }
  }, [sidebarCollapsed, reducedMotion, density]);

  const value = React.useMemo<ShellContextValue>(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed: () => setSidebarCollapsed((prev) => !prev),
      reducedMotion,
      setReducedMotion,
      density,
      setDensity,
    }),
    [sidebarCollapsed, reducedMotion, density]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShellPreferences() {
  const context = React.useContext(ShellContext);
  if (!context) {
    throw new Error('useShellPreferences must be used within ShellProvider');
  }
  return context;
}
