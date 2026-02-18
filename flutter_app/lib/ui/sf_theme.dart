import 'package:flutter/material.dart';

class SfTheme {
  static const _brandSeed = Color(0xFF0D1422);

  static ColorScheme lightScheme() => ColorScheme.fromSeed(
        seedColor: _brandSeed,
        brightness: Brightness.light,
      );

  static ColorScheme darkScheme() => ColorScheme.fromSeed(
        seedColor: _brandSeed,
        brightness: Brightness.dark,
      );

  static ThemeData light() => _build(lightScheme());

  static ThemeData dark() => _build(darkScheme(), isDark: true);

  static ThemeData _build(ColorScheme scheme, {bool isDark = false}) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      brightness: isDark ? Brightness.dark : Brightness.light,
      fontFamily: 'Tajawal',
    );

    final radius = BorderRadius.circular(18);
    final fieldRadius = BorderRadius.circular(16);

    return base.copyWith(
      scaffoldBackgroundColor: isDark ? const Color(0xFF070B14) : const Color(0xFFF7F8FC),
      canvasColor: isDark ? const Color(0xFF070B14) : const Color(0xFFF7F8FC),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: scheme.onSurface,
        ),
      ),
      dividerTheme: DividerThemeData(
        thickness: 1,
        color: (isDark ? Colors.white : Colors.black).withOpacity(0.08),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        color: scheme.surface.withOpacity(isDark ? 0.72 : 0.90),
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: radius),
        margin: EdgeInsets.zero,
      ),
      listTileTheme: ListTileThemeData(
        iconColor: scheme.onSurfaceVariant,
        textColor: scheme.onSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surface.withOpacity(isDark ? 0.55 : 0.92),
        border: OutlineInputBorder(borderRadius: fieldRadius),
        enabledBorder: OutlineInputBorder(
          borderRadius: fieldRadius,
          borderSide: BorderSide(color: scheme.outlineVariant.withOpacity(isDark ? 0.35 : 0.60)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: fieldRadius,
          borderSide: BorderSide(color: scheme.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: scheme.surface.withOpacity(isDark ? 0.35 : 0.80),
        indicatorColor: scheme.primary.withOpacity(isDark ? 0.22 : 0.14),
        selectedIconTheme: IconThemeData(color: scheme.primary),
        selectedLabelTextStyle: TextStyle(fontWeight: FontWeight.w800, color: scheme.primary),
        unselectedIconTheme: IconThemeData(color: scheme.onSurfaceVariant),
        unselectedLabelTextStyle: TextStyle(color: scheme.onSurfaceVariant),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface.withOpacity(isDark ? 0.35 : 0.92),
        indicatorColor: scheme.primary.withOpacity(isDark ? 0.22 : 0.14),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontWeight: selected ? FontWeight.w800 : FontWeight.w700,
            color: selected ? scheme.primary : scheme.onSurfaceVariant,
          );
        }),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? const Color(0xFF121A2D) : const Color(0xFF0D1422),
        contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  static BoxDecoration background({required bool isDark}) {
    final base = isDark ? const Color(0xFF070B14) : const Color(0xFFF7F8FC);
    final glowA = isDark ? const Color(0xFF1A2550) : const Color(0xFFE6EDFF);
    final glowB = isDark ? const Color(0xFF0E1430) : const Color(0xFFFFFFFF);

    return BoxDecoration(
      gradient: RadialGradient(
        center: const Alignment(-0.75, -0.9),
        radius: 1.45,
        colors: [glowA, glowB, base],
      ),
    );
  }
}

