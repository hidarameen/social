'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

type ThemePreset = 'orbit' | 'graphite' | 'sunrise'

type ThemePresetContextValue = {
  preset: ThemePreset
  setPreset: (value: ThemePreset) => void
}

const THEME_PRESET_STORAGE_KEY = 'socialflow_theme_preset_v1'

const ThemePresetContext = React.createContext<ThemePresetContextValue | null>(null)

function ThemePresetProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = React.useState<ThemePreset>('orbit')

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(THEME_PRESET_STORAGE_KEY)
      if (raw === 'orbit' || raw === 'graphite' || raw === 'sunrise') {
        setPreset(raw)
      }
    } catch {
      // ignore storage read failures
    }
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-preset', preset)
    try {
      window.localStorage.setItem(THEME_PRESET_STORAGE_KEY, preset)
    } catch {
      // ignore storage write failures
    }
  }, [preset])

  const value = React.useMemo<ThemePresetContextValue>(
    () => ({ preset, setPreset }),
    [preset]
  )

  return <ThemePresetContext.Provider value={value}>{children}</ThemePresetContext.Provider>
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemePresetProvider>{children}</ThemePresetProvider>
    </NextThemesProvider>
  )
}

export function useThemePreset() {
  const context = React.useContext(ThemePresetContext)
  if (!context) {
    throw new Error('useThemePreset must be used within ThemeProvider')
  }
  return context
}
