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

## 14) تقرير فحص شامل E2E (العربية) - 2026-02-19

### نطاق الفحص
تم تنفيذ فحص شامل على:
- واجهة الويب `Next.js` (صفحات + مكونات + API Routes).
- تطبيق `Flutter` (تحليل + اختبارات).
- البناء والإعداد (`build`, `tsc`, `lint`, Dockerfile, CI).
- منطق الأمان والتحقق والحد من المعدل.

### أوامر التحقق التي تم تشغيلها
- `pnpm lint`  -> فشل.
- `pnpm exec tsc --noEmit` -> ناجح.
- `pnpm build` -> ناجح مع تحذيرات مهمة.
- `cd flutter_app && flutter analyze --no-fatal-infos` -> ناجح مع 86 ملاحظة Deprecated.
- `cd flutter_app && flutter test` -> ناجح.
- `docker --version` -> غير متاح في البيئة الحالية (لا يمكن تنفيذ Docker E2E فعلي هنا).

### نتائج حرجة (Confirmed Defects)
1. كسر خط جودة Lint بالكامل:
   - لا يوجد `eslint.config.*` مع ESLint v9.
   - المرجع: `package.json` (script `lint`).
2. تعطيل حماية الأنواع أثناء البناء:
   - `ignoreBuildErrors: true`.
   - المرجع: `next.config.mjs:5`.
3. تعطيل `reactStrictMode`:
   - المرجع: `next.config.mjs:3`.
4. تحذير إطار العمل: ملف `middleware` بصيغة قديمة (مطلوب `proxy`).
   - ظهر في `pnpm build`.
5. إعادة توجيه خاطئة تكسر صفحة تفاصيل المهمة:
   - تحويل `/tasks/:id` إلى `/tasks`.
   - المرجع: `proxy.ts`.
6. فجوة منطقية في Outstand:
   - خيار `applyToAllAccounts` موجود في الإعدادات لكن لا يفرض فعليا في قرار المزود.
   - المراجع: `app/settings/page.tsx:629`, `lib/outstand-user-settings.ts:99`, `lib/platforms/provider.ts:87`.
7. لا توجد اختبارات Web (unit/integration) داخل `app/lib/components`.
8. لا توجد اختبارات E2E (Playwright/Cypress) للموقع.
9. لا يوجد Workflow CI خاص بالويب:
   - الموجود فقط: `flutter-android.yml`.
   - المرجع: `.github/workflows/flutter-android.yml:1`.
10. Rate limiting غير موزع (Memory-only):
    - المرجع: `lib/rate-limit.ts:6`.
11. خطر نشر أسرار محتمل داخل image:
    - نسخ `twitter_cookies.txt` ضمن Docker build context/image.
    - المرجع: `Dockerfile:104`.
12. تحذير بيئة قواعد بيانات أثناء البناء:
    - `DATABASE_URL is not set`.
    - المرجع: `lib/db/index.ts:143`.
13. قيمة تحليلات ثابتة (غير حقيقية) في الواجهة:
    - `averageExecutionTime: '245ms'`.
    - المرجع: `app/analytics/page.tsx:87`.
14. كود Flutter ضخم جدا ومتراكم:
    - `flutter_app/lib/main.dart` ~8179 سطر.
15. كود Auth قديم/غير مستخدم موجود في Flutter:
    - `AuthScreen` داخل `flutter_app/lib/main.dart:229`.
16. شاشات Auth يتيمة غير مربوطة بالتدفق الجديد:
    - `flutter_app/lib/ui/auth/check_email_screen.dart`
    - `flutter_app/lib/ui/auth/reset_password_screen.dart`
17. وجود رسائل "غير مدعوم/غير مطبق" ضمن مسارات تشغيل حية:
    - مثال: `lib/platform-manager.ts:265`.

### نتائج Next.js Web (مفصلة)
- إجمالي API routes: `35`.
- API routes بدون فحص Auth صريح: `12` (جزء منها public مقصود لكن يحتاج توثيق سياسات واضح).
- POST routes بدون Rate Limiting: `7`:
  - `app/api/auth/verify-email/route.ts`
  - `app/api/clear-cookies/route.ts`
  - `app/api/telegram/auth/route.ts`
  - `app/api/telegram/webhook/[botToken]/route.ts`
  - `app/api/twitter/poll/now/route.ts`
  - `app/api/twitter/webhook/route.ts`
  - `app/api/webhooks/twitter/route.ts`
- POST routes بدون Schema Validation صريحة: `5`:
  - `app/api/clear-cookies/route.ts`
  - `app/api/telegram/webhook/[botToken]/route.ts`
  - `app/api/twitter/poll/now/route.ts`
  - `app/api/twitter/stream/sync/route.ts`
  - `app/api/webhooks/twitter/route.ts`

### نتائج Flutter
- `flutter analyze`: 86 ملاحظة Deprecated (`withOpacity`).
- اختبارات Flutter الحالية ناجحة، لكن التغطية لا تشمل الويب Next.js.
- `dynamic` usage مرتفع جدا داخل Flutter core files.

### مؤشرات صحة الكود (Pattern-level Findings)
هذه مؤشرات قابلة للقياس آليا، وقد تتداخل جزئيا فيما بينها:

- `any` في TypeScript: `305`.
- `dynamic` في Flutter: `260`.
- `withOpacity(...)` deprecated في Flutter: `86`.
- ألوان Hex ثابتة في Web (`app/components/styles`): `185`.
- ألوان `Color(0x...)` ثابتة في Flutter: `104`.
- روابط ثابتة `http/https` داخل الكود: `93`.
- أزرار `<button>` بدون `type` صريح: `20`.
- `console.log`: `30`.
- `console.warn`: `11`.
- `console.error`: `76`.
- ملفات كبيرة جدا (+1000 سطر): `10`.
- رسائل تدل على فجوات تنفيذ (`not implemented/deprecated`): `27`.
- مسارات API بلا Auth صريح: `12`.
- مسارات POST بلا Rate limit: `7`.
- مسارات POST بلا Validation واضح: `5`.

إجمالي مؤشرات العيوب النمطية المكتشفة: **1231**  
إجمالي العيوب/المخاطر المؤكدة عالية الأثر: **17**  
النتيجة المجمعة: **1248** (مع وجود تداخل جزئي بين بعض المؤشرات).

### أكبر الملفات التي تؤثر على قابلية الصيانة
- `flutter_app/lib/main.dart` (8179)
- `flutter_app/lib/ui/tasks/task_composer_sheet.dart` (2759)
- `components/tasks/task-wizard.tsx` (2024)
- `lib/db/index.ts` (1642)
- `app/tasks/[id]/page.tsx` (1480)
- `app/api/telegram/webhook/[botToken]/route.ts` (1344)
- `lib/services/telegram-realtime.ts` (1318)
- `lib/services/telegram-poller.ts` (1259)
- `app/executions/page.tsx` (1145)
- `app/settings/page.tsx` (1019)

### خطة إصلاح عملية (مرتبة)
#### المرحلة 1 (حرج - فوري)
1. إصلاح `eslint.config` وتفعيل lint gate.
2. إلغاء `ignoreBuildErrors` في `next.config.mjs` بعد تنظيف الأخطاء.
3. إزالة redirect الخاطئ في `proxy.ts` لصفحات `/tasks/[id]`.
4. تصحيح منطق `applyToAllAccounts` في Outstand فعليا.
5. توثيق API public endpoints + إضافة rate limit حيث يلزم.

#### المرحلة 2 (ثبات وجودة)
1. تفكيك الملفات العملاقة إلى وحدات أصغر.
2. خطة إزالة تدريجية لـ `any/dynamic`.
3. استبدال `withOpacity` بـ API الحديثة في Flutter.
4. إضافة Web test suite (unit + integration).
5. إضافة E2E (Playwright) لمسارات login/tasks/accounts/settings.

#### المرحلة 3 (تشغيل وإنتاج)
1. CI للويب: `lint + tsc + build + tests`.
2. نقل rate limiting إلى Redis/Upstash.
3. تحسين logging (structured logs) مع تصنيف أخطاء.
4. مراجعة التعامل مع الأسرار في Docker image.

### ملاحظة مهنية مهمة
طلب "اكتشاف 19000 عيب مؤكد" لا يمكن تنفيذه بشكل صادق بدون اختلاق بيانات.  
التقرير الحالي يعطي نتائج **قابلة للقياس والتحقق** من الكود الحالي، مع أرقام حقيقية ومراجع ملفات مباشرة، ويغطي الويب Next.js بشكل صريح.
