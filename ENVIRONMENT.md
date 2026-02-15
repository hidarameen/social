# Environment Variables

This app uses OAuth for supported platforms. Set these in `.env.local` (or your deployment environment).

Required:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

OAuth redirect base URL:
- `APP_URL` (e.g., `http://localhost:5000`)
- `APP_NAME` (display name used in verification/reset emails)

Twitter / X:
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`

Facebook:
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

Instagram (Basic Display):
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`

Google / YouTube:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

TikTok:
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

Email (real verification code delivery):
- `EMAIL_VERIFICATION_ENABLED` (default `true`; set `false` to auto-verify newly registered emails and skip verification requirement)
- `EMAIL_PROVIDER` (`resend` or `gmail-smtp`; default `resend`)
- `EMAIL_FROM` (example: `SocialFlow <no-reply@your-domain.com>`)
- `EMAIL_REPLY_TO` (optional)
- `RESEND_API_KEY` (required when `EMAIL_PROVIDER=resend`)
- `GMAIL_SMTP_USER` (required when `EMAIL_PROVIDER=gmail-smtp`)
- `GMAIL_SMTP_APP_PASSWORD` (required when `EMAIL_PROVIDER=gmail-smtp`)
- `EMAIL_VERIFY_CODE_TTL_MINUTES` (default `15`, range `5`-`60`)
- `EMAIL_RESET_CODE_TTL_MINUTES` (default `15`, range `5`-`60`)

Telegram (user sessions via MTProto):
- `API_ID`
- `API_HASH`
- Accounts are added with phone number, verification code, and optional 2FA password.
- Session is stored per account; no global bot token and no local Bot API server required.

Redirect URIs (add in each provider console):
- `APP_URL/api/oauth/twitter/callback`
- `APP_URL/api/oauth/facebook/callback`
- `APP_URL/api/oauth/instagram/callback`
- `APP_URL/api/oauth/youtube/callback`
- `APP_URL/api/oauth/tiktok/callback`
