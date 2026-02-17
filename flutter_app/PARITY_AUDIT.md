# Flutter vs Web Parity Audit (Current State)

This audit compares the current Flutter app against the current web app in this repository.

## Scope checked
- Flutter app: `flutter_app/lib/main.dart`
- Web app routes: `app/*.tsx`, `app/tasks/*`, `app/accounts/*`, `app/settings/*`, `app/executions/*`, `app/analytics/*`

## Important conclusion
The Flutter app is **native UI** (no WebView widget in runtime code), but it is **not yet 100% feature/design parity** with web.

## Parity matrix

| Area | Web app status | Flutter app status | Parity |
|---|---|---|---|
| Login | Full login UX (validation, remember email, resend verification, localized UI) | Login exists; network errors improved | Partial |
| Register | Full register UX with password policy + terms + verify flow | Register exists; verify/resend flow now added | Partial |
| Forgot/Reset password | Implemented (`/forgot-password`, `/reset-password`) | Missing screens/flow | Missing |
| Verify email page | Implemented (`/verify-email`) | Inline verify code flow in register tab | Partial |
| Dashboard | Rich dashboard cards, quick actions, live refresh | Basic dashboard stats + recent tasks | Partial |
| Tasks list | Filters, sorting, pagination, bulk UX | Read-only list + search | Partial |
| Task create | Full wizard (`TaskWizard`) | Missing | Missing |
| Task edit | Full wizard edit mode | Missing | Missing |
| Task details | Run/pause/edit/delete, stats, analysis | Missing detail screen | Missing |
| Accounts management | OAuth/manual connect, add/remove/edit flows | Read-only accounts list | Missing |
| Executions | Advanced timeline/grouping + export | Read-only executions list | Partial |
| Analytics | Charts, filters, export CSV | Basic totals + list | Partial |
| Settings | Theme, credentials, notifications/privacy controls | Profile summary + sign out only | Missing |
| Localization | Arabic/English runtime support in web auth and UI | English-only current Flutter UI | Missing |
| Design parity | Full custom web design system | Flutter uses Material defaults, different visual system | Missing |

## What was fixed in this update
1. Android emulator local API host fallback fixed:
   - Uses `10.0.2.2` on Android when `APP_URL` is not set.
2. Flutter register flow now supports verification-required accounts:
   - Verify code + resend code + auto sign-in after verify.
3. API client error handling improved for connectivity/timeouts.
4. E2E-style Flutter tests added for auth flow and API contract behavior.

## E2E status
- Added runnable Flutter tests:
  - `flutter_app/test/auth_screen_test.dart`
  - `flutter_app/test/api_client_test.dart`
- `flutter test` passes in this environment.
- `flutter analyze` passes in this environment.

## Why 100% parity is not reached yet
The web app has many interactive flows and advanced screens that are not implemented in Flutter yet (task wizard, full account connect flows, advanced settings/credentials, full executions UX, etc.).

## Required implementation phases for true parity
1. Flutter navigation and screen architecture split (auth/dashboard/tasks/accounts/executions/analytics/settings + detail pages).
2. Task wizard parity (create/edit), task detail actions parity (run/pause/delete).
3. Accounts connect parity (OAuth and manual credential flows).
4. Settings parity (platform credentials, preferences, theme/localization).
5. Executions/analytics parity (charts, exports, advanced filters).
6. UI design parity pass (spacing, typography, color tokens, responsive behavior).
7. Full device E2E suite on Android emulator + web side-by-side regression suite.
