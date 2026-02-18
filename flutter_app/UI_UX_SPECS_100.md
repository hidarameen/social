# UI/UX Specs (100) for Flutter APK

These specs are a practical checklist derived from Material Design 3 guidance, Android large-screen/adaptive UI guidance, and accessibility standards (WCAG 2.2). Use this list as acceptance criteria when upgrading the Flutter UI to match the Next.js control app polish.

Sources (primary):
1. https://m3.material.io/
2. https://developer.android.com/guide/topics/large-screens
3. https://developer.android.com/develop/ui/views/layout/large-screens
4. https://www.w3.org/TR/WCAG22/

1. Use Material 3 component patterns by default; only deviate with a documented reason.
2. Use a single design token system for spacing, radii, typography scale, and shadows.
3. Use a single semantic color system (primary/secondary/tertiary/surface/error/warn/success) across all panels.
4. Ensure all interactive surfaces have clear hover/pressed/focus states.
5. Prefer progressive disclosure (basic first, advanced behind “Advanced” or “More”) for operator workflows.
6. Provide immediate feedback for actions (optimistic UI or explicit progress + completion message).
7. Never rely on color alone to communicate status; include labels/icons.
8. Never hide critical actions behind icon-only buttons without fallback labels on mobile.
9. Always provide an undo path for destructive operations when possible.
10. Always provide a confirmation step for irreversible destructive operations.

11. Minimum tap target size should be at least 48x48dp for touch.
12. Keep primary actions within thumb reach on phones; prefer bottom sheets/FAB where appropriate.
13. Use adaptive navigation: bottom navigation on phones, navigation rail on tablets/desktop widths.
14. Keep navigation destinations stable; avoid moving items between layouts.
15. Keep app bar actions contextual to the current panel (search/filter/export/refresh).
16. Provide an always-available “Refresh” action with clear scope (panel vs global).
17. Provide “Last updated” timestamps for data panels where staleness matters.
18. Use consistent breakpoints and responsive rules across the app (don’t invent per-screen breakpoints).
19. Constrain readable line length on large screens with a max content width.
20. Avoid horizontal scrolling tables on phones; provide stacked rows or detail views.

21. Use a consistent header hierarchy per panel: section pill, title, subtitle, then actions.
22. Use consistent card structure: header row, content, footer actions.
23. Keep card margins/gutters consistent across panels.
24. Keep icon size consistent: 16 (small), 20 (medium), 24 (default).
25. Use consistent corner radii for cards and controls (avoid mixed 10/14/18 without reason).
26. Use consistent separators/dividers; avoid visual noise from excessive lines.
27. Prefer fewer, stronger surfaces rather than many nested cards.
28. Use “sticky toolbars” for search/filter blocks on long lists.
29. Use skeleton loading for lists and KPI grids; avoid full-screen spinners for partial loads.
30. Always distinguish “empty state” from “error state” from “loading state”.

31. Use debounced search inputs (around 250-350ms) to reduce rebuilds and requests.
32. Keep filter state visible (chips or summary text) so users understand why results are filtered.
33. Provide a “Clear filters” action when any filter is active.
34. Sort controls should be explicit and show current sort direction.
35. Persist query/sort/filter state per panel across sessions when it improves operator workflows.
36. Use pagination or incremental loading for long lists; avoid unbounded rendering.
37. Show “loading more” affordances at list end and keep them stable.
38. Provide a detail view for list items that need diagnostics (Executions, Tasks).
39. Provide “copy” actions for IDs/handles/errors for operator workflows.
40. Provide export (CSV) where tables exist, with clear privacy implications.

41. Typography: define and use a type scale (display/title/body/label) and keep weights consistent.
42. Typography: ensure body text is readable on both themes (contrast and size).
43. Typography: keep label text short; use subtitles for explanation.
44. Text: avoid truncating critical identifiers; when truncating, provide a way to view full text.
45. Numbers: format numbers consistently and locale-aware where possible.
46. Dates/times: display relative time for recency, and provide absolute time on detail views.
47. Status: use consistent status vocabulary (Active/Paused/Error/Completed) across all panels.
48. Use consistent naming: “Executions” vs “Runs” should not vary without purpose.
49. Use consistent empty-state microcopy style (what happened, why, what to do next).
50. Use consistent error microcopy style (what failed, likely causes, next action).

51. Motion: keep transitions short and meaningful; avoid gratuitous animation.
52. Motion: respect a “reduced motion” setting that disables non-essential animation.
53. Motion: avoid animating layout shifts that cause accidental taps.
54. Motion: avoid parallax/complex effects that reduce readability.
55. Backgrounds: use subtle patterns/gradients but keep text contrast high.
56. Glass effects: use blur only when performance allows, and ensure fallback when blur is expensive.
57. Shadows: use soft, low-opacity shadows; avoid harsh outlines + heavy shadows together.
58. Use consistent hover/pressed ripples for tappable surfaces.
59. Avoid mixing multiple elevation models (flat + heavy elevation) in the same theme.
60. Avoid backgrounds that compete with content (keep noise subtle).

61. Accessibility: ensure color contrast meets WCAG requirements for text and essential UI.
62. Accessibility: ensure focus order is logical for keyboard and screen reader users.
63. Accessibility: provide semantics labels for icon-only buttons.
64. Accessibility: ensure disabled controls communicate why they’re disabled.
65. Accessibility: ensure validation errors are announced and visible near the field.
66. Accessibility: keep minimum touch target size and spacing between controls.
67. Accessibility: support text scaling without clipping or overflow.
68. Accessibility: ensure RTL layout reads naturally (alignment, icons, arrows).
69. Accessibility: avoid relying on small text to carry critical meaning.
70. Accessibility: avoid flashing/rapid animation; comply with reduced motion.

71. Forms: group related fields and provide section labels.
72. Forms: use inline help text for complex inputs (keys, secrets, tokens).
73. Forms: provide show/hide toggles for secret fields.
74. Forms: provide “copy to clipboard” and “paste from clipboard” affordances for key fields.
75. Forms: provide draft state and warn on unsaved changes when leaving.
76. Forms: validate early with clear messages; don’t wait only until submit.
77. Forms: keep submit button visible or reachable (sticky footer in sheets).
78. Forms: avoid long single-page forms; use steps/wizard for large workflows.
79. Forms: prevent conflicting selections with explicit UX (source vs target overlap).
80. Forms: ensure keyboard “Next/Done” flows correctly through fields.

81. Analytics: provide a KPI row (total, success, failure, success rate) at minimum.
82. Analytics: provide a top-N chart for quick pattern recognition.
83. Analytics: provide a sortable table for deep inspection.
84. Analytics: provide export CSV with consistent column ordering and escaping.
85. Analytics: provide a timeframe selector (24h/7d/30d) when the backend supports it.
86. Analytics: highlight anomalies and provide suggestions (if possible).
87. Analytics: show failure breakdown by category and platform (if possible).
88. Analytics: provide per-task navigation to task details and execution logs.
89. Analytics: cache results briefly to reduce reload cost and provide instant back navigation.
90. Analytics: ensure charts have labels and do not rely on color alone.

91. Settings: provide profile (name, image) and password change in one place.
92. Settings: provide theme mode + preset selection and persist it.
93. Settings: provide reduced motion and density controls and persist them.
94. Settings: provide sidebar collapsed preference and persist it.
95. Settings: provide privacy toggles (analytics/error logs) and persist them.
96. Settings: provide notification toggles and show system permission state when relevant.
97. Settings: provide diagnostics (build version, API URL, connectivity checks).
98. Settings: provide clear cache/reset actions with confirmation.
99. Settings: provide “about” with version, links, and release notes.
100. Settings: ensure sensitive data fields are protected (obscured by default) and never logged.

