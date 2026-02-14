# Android Deployment (PWA -> TWA)

This project is now configured as a Progressive Web App (PWA) and can be packaged to Android as a Trusted Web Activity (TWA).

## What is already implemented

- PWA manifest: `app/manifest.ts`
- Service worker: `public/sw.js`
- Service worker registration: `components/pwa/pwa-registration.tsx`
- Install prompt UI: `components/pwa/install-app-prompt.tsx`
- Offline fallback page: `app/offline/page.tsx`
- Digital Asset Links endpoint: `app/.well-known/assetlinks.json/route.ts`
- Android app icons:
  - `public/icon-192.png`
  - `public/icon-512.png`

## Environment variables

Set these in `.env.local` for TWA verification:

```env
ANDROID_TWA_PACKAGE_NAME=com.yourcompany.socialflow
ANDROID_TWA_SHA256_CERT_FINGERPRINTS=AA:BB:CC:...:ZZ
```

You can provide multiple fingerprints separated by commas or new lines.

## Build and run checks

```bash
pnpm dev
```

Then verify:

- `https://your-domain/manifest.webmanifest`
- `https://your-domain/sw.js`
- `https://your-domain/.well-known/assetlinks.json`

## Package to Android (no native rewrite)

1. Open PWABuilder.
2. Enter your production URL.
3. Choose Android package (TWA).
4. Download generated `.aab`.
5. Upload to Google Play Console (internal/closed testing first).

## Notes

- PWA/TWA requires HTTPS on production.
- Update `ANDROID_TWA_SHA256_CERT_FINGERPRINTS` with your Play/App signing certificate fingerprint(s).
