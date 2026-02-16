# SocialFlow Platform Report

Updated: February 16, 2026

## 1) Executive Summary
SocialFlow is a social automation platform with:
- A Next.js web application for full product operations.
- A real Flutter application (no WebView) for Android APK and Flutter Web.
- A shared backend API layer used by both web and Flutter clients.
- Docker-first deployment targeting Northflank.

The current architecture supports two production outputs from one repository:
- Web platform runtime.
- Android APK artifact generation.

## 2) Product Scope
### Core Capabilities
- User authentication and account management.
- Social account connections and credential handling.
- Task creation and scheduling workflows.
- Execution tracking and operational history.
- Analytics and reporting pages.
- Settings and profile management.

### Clients
- Web client: Next.js app routes and API routes.
- Flutter client: Native UI panels for login, register, dashboard, tasks, accounts, executions, analytics, and settings.

## 3) Technical Architecture
### Web Application
- Framework: Next.js (App Router).
- Language: TypeScript.
- Styling/UI: component-based React UI system.
- Auth: NextAuth (session-based for web).

### Flutter Application
- Framework: Flutter.
- Mode: Native widgets (not WebView).
- State and persistence: `shared_preferences`.
- Networking: `http` package calling backend APIs directly.

### Shared Backend
- API: Next.js API routes under `app/api/*`.
- Database access: internal `lib/db` layer.
- Runtime services: background processing, execution services, platform integrations.

### Mobile Token Bridge
To support Flutter without cookie/session dependence:
- Added `POST /api/mobile/login` for bearer token issuance.
- Added `GET /api/mobile/me` for token validation and profile bootstrap.
- Extended `getAuthUser()` to accept both auth modes:
1. NextAuth session (web).
2. Bearer token (Flutter).

## 4) Repository Layout
- `app/` Next.js pages and API routes.
- `components/` reusable web UI components.
- `lib/` shared services, auth, utilities, data access.
- `db/` SQL schema and database artifacts.
- `flutter_app/` Flutter source used for APK/Web builds.
- `Dockerfile` single unified multi-stage build for web runtime + APK artifact + Flutter web output.

## 5) Deployment Model (Northflank)
### Unified Build Pipeline
The root `Dockerfile` performs multi-stage steps:
1. Install web dependencies.
2. Build Flutter APK.
3. Build Flutter Web bundle.
4. Copy APK into web public assets.
5. Build Next.js runtime image.

### Runtime Outputs
- Web app served from Next.js runtime.
- APK downloadable from web public path.
- Flutter Web static bundle published at `/flutter-web/index.html`.

## 6) Environment Configuration
### Required
- `APP_URL`: Public HTTPS base URL used by Flutter build-time config.

### Recommended Security
- `MOBILE_AUTH_SECRET`: Signing secret for mobile bearer tokens.
- Standard app secrets for web auth and provider integrations.

## 7) Build and Run
### Web (Local)
```bash
pnpm install
pnpm dev
```

### Production Web Build
```bash
pnpm build
pnpm start
```

### Flutter APK (Local)
```bash
cd flutter_app
flutter pub get
flutter build apk --release --dart-define=APP_URL=https://your-domain.example.com/
```

### Flutter Web (Local)
```bash
cd flutter_app
flutter pub get
flutter build web --release --dart-define=APP_URL=https://your-domain.example.com/
```

### Unified Docker Build (Single Dockerfile)
```bash
docker build --build-arg APP_URL=https://your-domain.example.com/ -t socialflow .
```

## 8) API Overview for Flutter
### Authentication
- `POST /api/mobile/login`
- Request: email, password.
- Response: bearer token + user payload.

### Session Bootstrap
- `GET /api/mobile/me`
- Header: `Authorization: Bearer <token>`

### Core Data Panels
- `/api/dashboard`
- `/api/tasks`
- `/api/accounts`
- `/api/executions`
- `/api/analytics`
- `/api/profile`

## 9) Current Status
### Completed
- WebView removed from Flutter client.
- Native Flutter panel shell implemented.
- Mobile bearer-token auth bridge implemented.
- Unified Docker build enhanced for APK + Flutter Web output.

### In Progress / Next Expansion
- Full feature parity for every advanced web flow in Flutter.
- Deeper Flutter forms for create/edit task and platform-specific credentials.
- Additional UX polish for perfect parity across web and mobile.

## 10) Quality and Validation
### Performed
- Web build validation (`pnpm build`).
- TypeScript validation (`pnpm exec tsc --noEmit`).

### Notes
- Docker daemon availability depends on environment runtime.
- Flutter CLI availability depends on build environment image.

## 11) Recent Delivered Changes
- Native Flutter conversion from WebView architecture.
- New mobile auth token issuance and resolution paths.
- Unified container output includes Flutter Web static build.

## 12) Operational Guidance
When changing production domain:
1. Update `APP_URL` in build environment.
2. Rebuild deployment image.
3. Re-generate APK from the updated build.
4. Redeploy service and verify API reachability from client.

## 13) Conclusion
SocialFlow now has a dual-client foundation with a shared backend contract:
- Web platform remains fully operational on Next.js.
- Flutter is now a real native app path for APK and web builds.

This report replaces previous fragmented README files with a single organized technical reference.
