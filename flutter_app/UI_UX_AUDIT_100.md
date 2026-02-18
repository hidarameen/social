# Flutter APK UI/UX Audit (100 Issues)

Audit scope: Flutter UI implementation in `flutter_app/` compared against the current Next.js control app UX patterns and Material 3 guidance. This is a code-based audit (not an on-device visual inspection).
Audit date: 2026-02-18.

1. Navigation lacks consistent per-section captions (rail/drawer) across all densities, making scanning slower than the Next.js sidebar.
2. Rail "extended vs collapsed" behavior is not animated, causing abrupt layout change compared to the web shell.
3. Drawer navigation does not show a clear “active” pill/indicator with the same prominence as the web sidebar active style.
4. There is no global command palette or quick switcher (web uses Ctrl/Cmd+K), reducing operator speed.
5. There is no global shortcuts/help surface for power users.
6. There is no persistent “last refreshed” timestamp indicator, making data staleness unclear.
7. Refresh is duplicated (AppBar refresh and panel refresh), but the UI does not explain which one affects which data scope.
8. AppBar lacks contextual actions per panel (search/filter/export), forcing controls into the panel and increasing scroll.
9. Background and card styling are not consistently applied to legacy `Card(...)` usage across the app, producing visual inconsistency.
10. Several panels still use mixed component styles (plain `Card` vs `SfPanelCard`), causing uneven elevation/border/radius.

11. Typography scale is not centralized; headings and labels use ad-hoc `TextStyle(...)` values.
12. Status semantics (success/warn/error) use inconsistent hues and saturation across panels.
13. Chips/pills do not use a unified system (some are `Container` pills, some are `SfBadge`), reducing consistency.
14. Iconography is inconsistent (mix of outline/filled, mixed metaphors across panels).
15. Microcopy uses inconsistent tone (e.g., “Task execution” vs “Executions”), reducing perceived polish.
16. There is no density switch for list content spacing (only VisualDensity), so some layouts remain too roomy on tablets.
17. No unified “glass” surface specification (blur + border + noise) like the web’s glass toolbar.
18. No unified “sticky toolbar” behavior for filters/search in long lists (web uses sticky toolbars).
19. No unified empty-state illustration pattern per section (icon-only empties vary).
20. No unified skeleton loading pattern; many screens still show spinners or nothing.

21. Dashboard KPIs do not include trend deltas or timeframe scoping like “Last 24h/7d”.
22. Dashboard “Recent Automations” cards are dense and lack a consistent information hierarchy on small screens.
23. Dashboard “System Health” does not include actionable drill-down links (e.g., “Show failing tasks/accounts”).
24. Dashboard does not surface “recent failures” as a first-class callout.
25. Dashboard does not clearly differentiate “workspace empty” vs “data failed to load” states.
26. Dashboard shows platform chips but lacks per-platform counts/legend clarity in compact layouts.
27. Dashboard actions (“Connect Account”, “Create Task”) do not show context hints (where it will open and what it does).
28. Dashboard uses multiple different pill styles instead of one KPI pill component.
29. Dashboard does not have a compact mode layout tuned for phone width (KPI grid wrapping is fragile).
30. Dashboard does not provide a “quick glance” mode for operators (compact KPIs + top 3 alerts).

31. Tasks filters are many; the UI lacks a summary “filter bar” with chips showing active filters.
32. Tasks sort controls are mixed with filters and do not have a clear “sort state” indicator.
33. Tasks list cards do not have a consistent header (title + status + last run + actions), varying by data.
34. Tasks actions are icon-only and rely on tooltips; on mobile these are less discoverable.
35. Tasks do not have multi-select and bulk operations (pause/resume/delete), limiting operational workflows.
36. Tasks do not expose a “duplicate task” flow, a common power-user action.
37. Tasks error messaging shows generic “Failed” text without guided remediation steps.
38. Tasks do not provide a preview of routes (source->targets) in a compact, glanceable format.
39. Tasks do not provide an “audit trail” surface (who changed what, when).
40. Task edit sheet has limited progressive disclosure; it is one long form without steps.

41. Task editor account selection is not searchable; lists become unusable at scale.
42. Task editor does not show per-account health/authorization status inline.
43. Task editor does not provide content previews for text/image/video/link with final render.
44. Task editor does not provide a “test run” that validates credentials/content before saving.
45. Task editor validation errors are not summarized at top; users must hunt for the failing field.
46. Task editor lacks contextual help for status/content type choices.
47. Task editor does not surface rate limits/retry strategy (if supported), leaving operators blind.
48. Task editor does not warn about dangerous configurations (e.g., very wide fan-out).
49. Task editor lacks drafts/autosave; accidental dismiss loses work.
50. Task editor form does not adapt well to smaller screens when many fields are shown.

51. Accounts panel lacks grouping by platform, which is essential once many accounts exist.
52. Accounts panel lacks “needs re-auth” / OAuth warning filter.
53. Accounts panel does not provide direct actions per account (reconnect, open profile, copy handle).
54. Accounts panel does not provide an account details view (metadata, last activity).
55. Accounts panel search is not debounced and can rebuild heavily on every keystroke.
56. Accounts panel platform icons are generic and not mapped to the same brand semantics as the web UI.
57. Accounts panel does not show connection quality (latency/errors) or last sync.
58. Accounts panel does not clearly separate “inactive” from “warning” states.
59. Accounts panel lacks skeleton loading states.
60. Accounts panel empty state does not include a deep link/QR/action to the relevant web flow.

61. Executions panel lacks filters by status (success/failed/running/pending).
62. Executions panel lacks a detail view for a single execution (logs, payload, errors).
63. Executions panel does not show duration/latency, blocking performance diagnosis.
64. Executions panel does not provide “retry execution” action (if supported).
65. Executions panel does not provide “copy error” / “share report” affordances.
66. Executions panel shows minimal source/target context; it should show platform chips and account labels.
67. Executions panel lacks timeline visualization (queued -> running -> completed).
68. Executions panel does not paginate/infinite-scroll clearly for large histories.
69. Executions panel lacks offline/cached-view indicator.
70. Executions panel lacks dedicated empty states for “no data” vs “filters exclude all”.

71. Analytics panel previously lacked search/sort/table parity; it is improving but still lacks full Next.js insights blocks.
72. Analytics lacks average execution time (web shows a placeholder; mobile should show real or omit clearly).
73. Analytics lacks the “Performance Insights” section (best tasks + recent summary) that the web UI presents.
74. Analytics lacks timeframe scoping (24h/7d/30d) and comparison to previous period.
75. Analytics lacks per-platform breakdown.
76. Analytics lacks a failure category breakdown.
77. Analytics chart lacks touch tooltips and highlight interactions.
78. Analytics table lacks a compact “row actions” menu (view task, open logs).
79. Analytics does not persist query/sort state across sessions like the web query cache.
80. Analytics does not show stable caching/stale indicators.

81. Settings page previously lacked Next.js parity; improved, but still missing preset preview/animation parity.
82. Settings does not show a “Save All Changes” top action like web; actions are per-section.
83. Settings platform credential fields do not show per-field validation and formatting hints (e.g., key length).
84. Settings credentials section does not warn about leaving page with unsaved draft changes.
85. Settings does not show last updated timestamps for platform credentials.
86. Settings does not support “export data” actual file delivery; currently it is limited by mobile constraints.
87. Settings does not include a “Reset to defaults” flow with confirmation.
88. Settings does not expose a diagnostics page (build info, API reachability, last sync).
89. Settings does not include an “About” section with version and release notes.
90. Settings does not include notification permission state and deep link to system settings.

91. Profile image uses raw URLs; there is no in-app image picker or cropping like web upload flow.
92. Password change UX does not include strength meter or policy hints.
93. Password change UX does not include “show/hide password” toggles per field.
94. Auth screens do not consistently use the same surface/background system as the shell screens.
95. Error states often use SnackBars only; there is no persistent error panel for long messages.
96. Accessibility: many interactive elements lack explicit semantics labels beyond visible text.
97. Accessibility: minimum tap target is not guaranteed for all custom clickable widgets.
98. Accessibility: dynamic type scaling is not reviewed; some text may clip at large font sizes.
99. Accessibility: RTL layout is present but not fully audited for alignment, icons, and flow direction.
100. Performance: large single-file UI (`lib/main.dart`) increases maintenance risk and makes consistent UX changes harder.

