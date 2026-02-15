# SocialFlow Bot - Full Engineering Audit (100 Findings)

Audit date: February 15, 2026  
Scope: Frontend UI, i18n/language persistence, routes, middleware, API handlers, background services, and database schema.  
Method: Static code audit + build/type/lint checks + route map inspection.

## Validation Run
- `pnpm -s lint`: failed (`eslint: command not found`).
- `pnpm -s tsc --noEmit`: passed.
- `pnpm -s build`: passed with warnings.
  - Middleware convention deprecation warning (`middleware` -> `proxy`).
  - Build output includes: `Skipping validation of types`.

## What This Report Focuses On
- Language persistence and localization behavior across refresh/navigation/routes.
- Route and middleware consistency (including deprecated Twitter poll migration status).
- Responsive/adaptive UI behavior and fixed-layer conflicts.
- Accessibility and interaction quality.
- Backend/API/DB technical and security gaps that affect product reliability.

## 100 Findings (Defects, Gaps, Risks, Missing Items)

### A) Language Persistence & i18n
1. Root document is hardcoded to Arabic before hydration (`app/layout.tsx:62`); users can see wrong initial locale flash. Fix: derive locale server-side (cookie/header) and render correct SSR `lang/dir`.
2. Root `data-locale` is hardcoded to Arabic (`app/layout.tsx:65`). Fix: set from server locale source, not static literal.
3. Locale is restored from `localStorage` only (`app/layout.tsx:93`); server cannot honor locale on first request. Fix: persist locale in cookie and read on server.
4. No `Accept-Language` negotiation path exists for first visit (`app/layout.tsx:93`, `app/providers.tsx:12`). Fix: add server-side locale negotiation fallback.
5. Runtime localization is disabled for auth routes (`components/i18n/runtime-localizer.tsx:89`). Fix: localize auth pages via dictionary, not route exclusion.
6. Runtime localizer only runs for Arabic (`components/i18n/runtime-localizer.tsx:99`). Fix: use proper dictionary-driven rendering for both locales; avoid one-way runtime patching.
7. Runtime localizer exits early without explicit restoration pass (`components/i18n/runtime-localizer.tsx:105`), risking stale translated nodes after route/locale transitions. Fix: implement deterministic render-level i18n instead of DOM mutation.
8. Whole-body MutationObserver on text + attributes is expensive (`components/i18n/runtime-localizer.tsx:154`). Fix: remove runtime observer and migrate strings to keyed translations.
9. String replacement uses naive global split/join (`lib/i18n/runtime-translations.ts:283`) and can alter unintended text fragments. Fix: use keyed translation at component level.
10. Runtime translation source keys are duplicated (e.g. `All statuses`) (`lib/i18n/runtime-translations.ts`, duplicate scan). Fix: deduplicate translation pairs and add CI check.
11. Runtime translation list is sorted in-place globally (`lib/i18n/runtime-translations.ts:275`), mutating module state. Fix: sort a cloned array.
12. Dictionary scope is narrow versus actual UI surface (`lib/i18n/dictionary.ts:7`). Fix: migrate all visible strings to dictionary keys.
13. Missing dictionary key `sidebar.toggleSidebar` used in UI (`components/layout/sidebar.tsx:115`). Fix: add missing key in both locales.
14. Missing dictionary key `sidebar.toggleSidebarCaption` (`components/layout/sidebar.tsx:118`). Fix: add key in both locales.
15. Navigation labels are hardcoded English (`components/layout/nav-items.ts:21`). Fix: move labels/captions to dictionary.
16. Dashboard page still has many hardcoded English strings (`app/page.tsx:327`). Fix: wrap all page text with translation keys.
17. Tasks page has hardcoded English sections and filters (`app/tasks/page.tsx:354`). Fix: localize all user-visible strings.
18. Task detail page is mostly hardcoded English (`app/tasks/[id]/page.tsx:468`). Fix: convert to dictionary-based UI copy.
19. Accounts page is mostly hardcoded English (`app/accounts/page.tsx:526`). Fix: localize all form labels/help/errors.
20. Analytics page is mostly hardcoded English (`app/analytics/page.tsx:147`). Fix: localize chart/table headers and empty states.
21. Executions page is mostly hardcoded English (`app/executions/page.tsx:582`). Fix: localize filters, statuses, and progress copy.
22. Settings page is mostly hardcoded English (`app/settings/page.tsx:312`). Fix: translate all settings labels and messages.
23. Register page is English-only (`app/register/page.tsx:242`). Fix: integrate `useLanguage` + dictionary keys.
24. Forgot-password page is English-only (`app/forgot-password/page.tsx:66`). Fix: localize page and API feedback.
25. Reset-password page is English-only (`app/reset-password/reset-password-page-client.tsx:112`). Fix: localize all labels/rules/messages.
26. Verify-email page is English-only (`app/verify-email/verify-email-page-client.tsx:128`). Fix: localize validation and CTA copy.
27. Privacy policy page is English-only (`app/privacy/page.tsx:121`). Fix: provide Arabic legal copy or locale-specific content versions.
28. Terms page is English-only (`app/terms/page.tsx:126`). Fix: provide Arabic legal copy or locale-specific variants.
29. Offline page is English-only (`app/offline/page.tsx:18`). Fix: localize offline states and action labels.
30. Header profile dialog strings are hardcoded English (`components/layout/header.tsx:648`). Fix: move dialog strings to dictionary.
31. Global command palette and quick actions are hardcoded English (`components/layout/global-shell-enhancements.tsx:40`). Fix: localize all command text.
32. PWA install button copy is hardcoded English (`components/pwa/install-app-prompt.tsx:89`). Fix: localize install prompt label.
33. Manifest language is fixed to English (`app/manifest.ts:16`). Fix: generate manifest locale-aware or use neutral language strategy.
34. Relative-time labels are English-only (`app/page.tsx:120`, `app/tasks/page.tsx:69`). Fix: locale-aware relative formatter.
35. No automated i18n regression tests exist (repo-wide). Fix: add E2E coverage for locale persistence on refresh/navigation.

### B) Routes, Middleware, and Flow Consistency
36. Middleware still explicitly bypasses deprecated poll route (`middleware.ts:42`). Fix: remove poll route bypass.
37. Middleware matcher still includes deprecated poll path (`middleware.ts:92`). Fix: remove from matcher.
38. Deprecated poll API route still shipped (`app/api/twitter/poll/now/route.ts:5`). Fix: remove endpoint after migration window.
39. Deprecated duplicate webhook endpoint still exists (`app/api/webhooks/twitter/route.ts:12`). Fix: remove route once clients migrated.
40. Middleware forcibly redirects `/tasks/:id` to `/tasks` (`middleware.ts:69`). Fix: allow detail route or remove detail page entirely.
41. Task detail page still exists while middleware blocks it (`app/tasks/[id]/page.tsx:39`). Fix: resolve route policy conflict.
42. Task details API exists for blocked page (`app/api/tasks/[id]/details/route.ts:11`). Fix: remove dead API or restore route.
43. Legacy `/dashboard/*` routes remain in production build output (`app/dashboard/page.tsx:4`). Fix: remove legacy route files after transition.
44. Large legacy dashboard accounts client remains (`app/dashboard/accounts/accounts-page-client.tsx:1`) and increases maintenance risk. Fix: delete unused legacy screen.
45. Login callback remap handles only selected legacy paths (`app/login/page.tsx:19`). Fix: centralize full legacy route normalization.
46. Locale is not encoded in URL; cross-device deep links cannot preserve chosen language (design gap). Fix: add locale segment/query/cookie strategy.
47. Offline page uses raw anchor reload (`app/offline/page.tsx:24`) which may disrupt SPA state. Fix: use router navigation consistently.
48. Executions page mixes SSE + interval polling + focus refresh (`app/executions/page.tsx:355`, `app/executions/page.tsx:387`). Fix: pick one primary real-time channel with fallback.
49. Global connectivity probe runs every 15s regardless page context (`components/layout/global-shell-enhancements.tsx:146`). Fix: backoff + visibility-based cadence.
50. Poll migration is incomplete across routes/forms/middleware (`middleware.ts:42`, `components/tasks/task-wizard.tsx:1360`, `app/tasks/[id]/page.tsx:739`). Fix: remove poll-era fields and route references.

### C) Responsive/Adaptive UI Issues
51. Analytics table enforces `min-w-[720px]` causing horizontal scroll on mobile (`app/analytics/page.tsx:298`). Fix: responsive card/table switch below `md`.
52. Executions source label hard-truncated at `max-w-[180px]` (`app/executions/page.tsx:862`). Fix: responsive wrap/tooltip/details pattern.
53. Executions target label hard-truncated at `max-w-[180px]` (`app/executions/page.tsx:865`). Fix: adaptive layout and multiline support.
54. Route detail labels are truncated at `max-w-[170px]` (`app/executions/page.tsx:1071`). Fix: expand width or use overflow strategy.
55. Telegram phone selector grid uses fixed min width constraints (`app/accounts/page.tsx:635`) and can be cramped on narrow devices. Fix: stack inputs earlier and reduce minimums.
56. Auth shell has off-canvas absolute panel (`left-[-110px]`, `w-[360px]`) (`components/auth/auth-shell.tsx:70`). Fix: use responsive container without negative offsets.
57. `overflow-x: hidden` on body masks layout bugs (`app/globals.css:583`). Fix: remove global hide and fix root overflow sources.
58. Multiple fixed layers compete (`header`, `offline-banner`, `route-progress`) (`app/globals.css:1093`, `app/globals.css:1097`). Fix: define z-index contract and collision tests.
59. Install prompt fixed bottom-left can overlap content controls (`components/pwa/install-app-prompt.tsx:68`). Fix: reserve safe layout space / dismiss persistence.
60. Floating action button is fixed bottom-right globally (`components/layout/global-shell-enhancements.tsx:259`) and can cover content. Fix: context-aware placement rules.
61. Sticky toolbar top offset is hardcoded (`app/globals.css:1089`) and may drift with header size changes. Fix: compute from CSS variable only.
62. Full-screen route loader uses high fixed z-index (`app/globals.css:835`) and can lock UI if state gets stuck. Fix: watchdog timeout + state sanity checks.
63. Route loader uses large fixed orbits that can dominate tiny screens (`app/globals.css:864`). Fix: viewport-scaled loader geometry.
64. Dashboard header copy is long and can crowd small viewports (`app/page.tsx:331`). Fix: shorter mobile copy variants.
65. Tasks filters are dense (`md:grid-cols-5`) (`app/tasks/page.tsx:392`) and overloaded on tablets. Fix: split into collapsible filter sections.
66. Settings preset cards use 3-column grid at small breakpoints (`app/settings/page.tsx:473`) and become cramped. Fix: 1-2 columns with progressive reveal.
67. Task wizard source settings packs many controls in one view (`components/tasks/task-wizard.tsx:1245`). Fix: per-platform accordion with compact mobile forms.
68. Task detail edit screen is a long monolithic form (`app/tasks/[id]/page.tsx:509`). Fix: sectioned tabs/collapsible cards.
69. Offline banner width can block interaction under top nav (`app/globals.css:1094`). Fix: dock banner below header region with avoid-overlap logic.
70. `background-attachment: fixed` on body (`app/globals.css:589`) may cause mobile repaint jank. Fix: disable fixed background on touch devices.

### D) Accessibility & Interaction Quality
71. Delete icon button in accounts list lacks `aria-label` (`app/accounts/page.tsx:963`). Fix: add descriptive label/title.
72. Edit icon button in task detail lacks `aria-label` (`app/tasks/[id]/page.tsx:494`). Fix: add `aria-label="Edit task"`.
73. Delete icon button in task detail lacks `aria-label` (`app/tasks/[id]/page.tsx:500`). Fix: add `aria-label="Delete task"`.
74. Executions card expansion uses clickable `<div>` (`app/executions/page.tsx:843`) and is not keyboard-activatable. Fix: use a `<button>` wrapper with keyboard support.
75. Password fields in profile dialog have placeholders but no explicit labels (`components/layout/header.tsx:712`). Fix: add `<Label>` and `id` mapping.
76. Several status signals depend on color only (`status-pill` usage, e.g. `app/tasks/page.tsx:36`). Fix: include text + SR-only state cues.
77. Route progress bar has no live-region semantics (`app/globals.css:1097`, `components/layout/global-shell-enhancements.tsx:249`). Fix: announce route loading state for assistive tech.
78. Offline status banner is not `aria-live` (`components/layout/global-shell-enhancements.tsx:251`). Fix: add polite live region.
79. Command palette is custom but lacks explicit listbox semantics (`components/layout/global-shell-enhancements.tsx:313`). Fix: adopt accessible combobox/listbox pattern.
80. Several icon controls are sub-44px targets (`components/layout/header.tsx:487`, `components/layout/sidebar.tsx:217`). Fix: enforce minimum touch size in design tokens.
81. Custom scrollbars may reduce contrast/visibility (`app/globals.css:678`). Fix: meet contrast and size guidance.
82. Mixed bidi content and untranslated English labels in RTL mode can confuse screen readers (`app/tasks/page.tsx:354`, `app/analytics/page.tsx:147`). Fix: fully localize and test SR in RTL.

### E) Backend, API, DB, Security, and Quality Gates
83. `reactStrictMode` is disabled (`next.config.mjs:3`). Fix: enable strict mode and address side-effect issues.
84. Build ignores TypeScript errors (`next.config.mjs:5`). Fix: set `ignoreBuildErrors: false`.
85. Lint script exists but `eslint` is not installed (`package.json:7`). Fix: add ESLint deps/config and enforce in CI.
86. Build process explicitly skips type validation (`build output`). Fix: enforce type checks during build pipeline.
87. No automated tests are present (repo-level gap). Fix: add unit + integration + Playwright smoke tests.
88. Platform credentials GET returns full credential objects (`app/api/platform-credentials/route.ts:30`). Fix: return redacted credentials by default.
89. Platform credentials PUT echoes saved credentials (`app/api/platform-credentials/route.ts:68`). Fix: return masked representation only.
90. `platform_accounts.access_token` stored plaintext (`db/schema.sql:64`). Fix: encrypt at application layer with key rotation.
91. `platform_accounts.refresh_token` stored plaintext (`db/schema.sql:65`). Fix: encrypt/seal refresh tokens.
92. `user_platform_credentials.credentials` stores secret-bearing JSON plaintext (`db/schema.sql:46`). Fix: selective field encryption + sealed blobs.
93. API errors are English-only across endpoints (example `app/api/tasks/route.ts:24`). Fix: support localized error envelopes.
94. API layer has no locale negotiation (`rg` scan: no `Accept-Language` use under `app/api`). Fix: add request locale resolver middleware/helper.
95. Task create validation allows untyped `filters` (`z.any`) (`app/api/tasks/route.ts:102`). Fix: define strict nested Zod schema.
96. Task update validation allows untyped `filters/transformations` (`app/api/tasks/[id]/route.ts:61`). Fix: strict schema + sanitization.
97. CSV export endpoints do not neutralize formula injection (`app/api/tasks/export/route.ts:38`, `app/api/analytics/export/route.ts:37`, `app/api/executions/export/route.ts:38`). Fix: prefix risky cells (`= + - @`) with `'`.
98. Rate limiter is process-local memory map (`lib/rate-limit.ts:6`) and breaks in multi-instance deployments. Fix: use Redis/shared limiter.
99. Rate-limit client key trusts `x-forwarded-for` directly (`lib/rate-limit.ts:28`). Fix: use trusted proxy chain parsing.
100. Advanced processing service contains placeholder metric (`245ms`) and mixed-language production logic/comments (`lib/services/advanced-processing.ts:286`). Fix: replace placeholder analytics with real metrics and normalize production code quality.

## Priority Remediation Plan
1. **P0 (security/reliability)**: items 83-99 (strict build gates, credentials exposure/encryption, rate limit hardening, schema validation).
2. **P1 (functional correctness)**: items 36-50 (route/middleware cleanup, remove poll leftovers, resolve `/tasks/:id` contradiction).
3. **P1 (i18n correctness)**: items 1-35 (remove runtime text patching, move to dictionary-driven rendering, add server locale persistence).
4. **P2 (UX/responsive/accessibility)**: items 51-82 (layout collisions, mobile density, keyboard/screen-reader improvements).
5. **P2 (test coverage)**: add CI checks for lint, typecheck, route smoke tests, i18n persistence tests, and responsive snapshots.

## Notes
- This report is evidence-based from the current repository state and command results on February 15, 2026.
- Because no automated browser device matrix is currently implemented, responsive/accessibility findings are derived from code-level and structural analysis and should be confirmed with Playwright/device runs after fixes.
