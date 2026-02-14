import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { IBM_Plex_Mono, Space_Grotesk, Tajawal } from 'next/font/google'
import Providers from './providers'
import { Toaster } from 'sonner'
import { SplashOverlay } from '@/components/layout/splash-overlay'
import { GlobalShellEnhancements } from '@/components/layout/global-shell-enhancements'
import { PwaRegistration } from '@/components/pwa/pwa-registration'
import { InstallAppPrompt } from '@/components/pwa/install-app-prompt'
import './globals.css'

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-display',
  display: 'swap',
})

const arabicFont = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SocialFlow - Social Media Automation Platform',
  description: 'Professional social media automation, scheduling, and analytics platform. Connect multiple accounts across Facebook, Instagram, Twitter, TikTok, YouTube, Telegram, and LinkedIn.',
  generator: 'v0.app',
  applicationName: 'SocialFlow',
  keywords: 'social media, automation, scheduling, buffer, zapier, ifttt, facebook, instagram, twitter, tiktok, youtube',
  authors: [{ name: 'SocialFlow' }],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'SocialFlow',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef3ff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1422' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${monoFont.variable} ${arabicFont.variable} font-sans antialiased`}>
        <Providers>
          <PwaRegistration />
          <SplashOverlay />
          <GlobalShellEnhancements />
          <InstallAppPrompt />
          {children}
        </Providers>
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  )
}
