# Northflank Deployment (Dockerfile)

This project is ready to deploy on Northflank using the root `Dockerfile`.

## Runtime behavior

- Container listens on `0.0.0.0`
- Uses dynamic `PORT` (Northflank-injected), default `5000`
- Runs as non-root user
- Includes `ffmpeg` and bundled `bin/yt-dlp`
- Healthcheck endpoint: `/login`

## Required Northflank settings

1. Service type: `Deployment Service`
2. Build type: `Dockerfile`
3. Dockerfile path: `./Dockerfile`
4. Exposed port: `5000` (or keep default with injected `PORT`)

## Required environment variables

Set these in Northflank:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (example: `https://your-app.your-domain.com`)
- `APP_URL` (same public app URL)

If using OAuth/providers:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

If using email verification/reset:

- `EMAIL_VERIFICATION_ENABLED`
- `EMAIL_PROVIDER` (`resend` or `gmail-smtp`)
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `RESEND_API_KEY` (when `EMAIL_PROVIDER=resend`)
- `GMAIL_SMTP_USER` (when `EMAIL_PROVIDER=gmail-smtp`)
- `GMAIL_SMTP_APP_PASSWORD` (when `EMAIL_PROVIDER=gmail-smtp`)

## Notes

- Do not commit `.env.local`; configure secrets in Northflank Environment.
- If your database uses IP allowlists, allow Northflank egress/IP range.
- After first deploy, verify:
  - `/login`
  - `/manifest.webmanifest`
  - `/.well-known/assetlinks.json`
