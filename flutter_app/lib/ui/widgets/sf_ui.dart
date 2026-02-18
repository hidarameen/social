import 'package:flutter/material.dart';

class SfTokens {
  static const double pagePadding = 14;
  static const double cardPadding = 14;
  static const double sectionGap = 12;
  static const double itemGap = 10;

  static const double radiusLg = 18;
  static const double radiusMd = 14;

  static BorderRadius get radiusLarge => BorderRadius.circular(radiusLg);
  static BorderRadius get radiusMedium => BorderRadius.circular(radiusMd);
}

class SfPage extends StatelessWidget {
  const SfPage({
    super.key,
    required this.child,
    this.maxWidth = 1120,
    this.padding = const EdgeInsets.all(SfTokens.pagePadding),
  });

  final Widget child;
  final double maxWidth;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

class SfAppBackground extends StatelessWidget {
  const SfAppBackground({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final bgStart = isDark ? const Color(0xFF1F232A) : const Color(0xFFFFFFFF);
    final bgEnd = scheme.background;

    final glowA = scheme.primary.withOpacity(isDark ? 0.14 : 0.10);
    final glowB = scheme.secondary.withOpacity(isDark ? 0.10 : 0.08);

    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [bgStart, bgEnd],
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(-0.8, -0.85),
                radius: 1.25,
                colors: [glowA, Colors.transparent],
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0.9, -0.2),
                radius: 1.15,
                colors: [glowB, Colors.transparent],
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: IgnorePointer(
            child: CustomPaint(
              painter: _SfDotGridPainter(
                color: scheme.outline.withOpacity(isDark ? 0.12 : 0.10),
              ),
            ),
          ),
        ),
        child,
      ],
    );
  }
}

class _SfDotGridPainter extends CustomPainter {
  _SfDotGridPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    const double step = 28;
    const double r = 0.9;

    for (double y = 0; y <= size.height; y += step) {
      for (double x = 0; x <= size.width; x += step) {
        canvas.drawCircle(Offset(x, y), r, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SfDotGridPainter oldDelegate) {
    return oldDelegate.color != color;
  }
}

class SfSectionHeader extends StatelessWidget {
  const SfSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              if (subtitle != null && subtitle!.trim().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: TextStyle(
                    color: scheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: 10),
          trailing!,
        ],
      ],
    );
  }
}

class SfPanelCard extends StatelessWidget {
  const SfPanelCard({
    super.key,
    this.padding = const EdgeInsets.all(SfTokens.cardPadding),
    this.child,
    this.leading,
    this.trailing,
  });

  final EdgeInsets padding;
  final Widget? child;
  final Widget? leading;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final body = Padding(padding: padding, child: child);

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: SfTokens.radiusLarge,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            scheme.surface.withOpacity(isDark ? 0.82 : 1.0),
            scheme.surfaceContainerHighest.withOpacity(isDark ? 0.46 : 0.40),
          ],
        ),
        boxShadow: [
          BoxShadow(
            blurRadius: isDark ? 22 : 26,
            spreadRadius: -18,
            offset: const Offset(0, 18),
            color: scheme.onSurface.withOpacity(isDark ? 0.22 : 0.14),
          ),
        ],
        border: Border.all(color: scheme.outline.withOpacity(isDark ? 0.70 : 0.75)),
      ),
      child: ClipRRect(
        borderRadius: SfTokens.radiusLarge,
        child: Stack(
          children: [
            body,
            if (leading != null)
              Positioned(
                left: 12,
                top: 12,
                child: leading!,
              ),
            if (trailing != null)
              Positioned(
                right: 12,
                top: 12,
                child: trailing!,
              ),
          ],
        ),
      ),
    );
  }
}

class SfBadge extends StatelessWidget {
  const SfBadge(
    this.text, {
    super.key,
    required this.tone,
    this.icon,
  });

  final String text;
  final Color tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: tone.withOpacity(isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tone.withOpacity(isDark ? 0.35 : 0.30)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: tone),
            const SizedBox(width: 6),
          ],
          Text(
            text,
            style: TextStyle(color: tone, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class SfEmptyState extends StatelessWidget {
  const SfEmptyState({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.primary,
    this.secondary,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget? primary;
  final Widget? secondary;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: SfPanelCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: scheme.primary.withOpacity(0.14),
                  border: Border.all(color: scheme.primary.withOpacity(0.28)),
                ),
                child: Icon(icon, color: scheme.primary),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(color: scheme.onSurfaceVariant, fontWeight: FontWeight.w700),
              ),
              if (primary != null || secondary != null) ...[
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  alignment: WrapAlignment.center,
                  children: [
                    if (secondary != null) secondary!,
                    if (primary != null) primary!,
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class SfKpiTile extends StatelessWidget {
  const SfKpiTile({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.tone,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final resolved = tone ?? scheme.primary;
    return SfPanelCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  resolved.withOpacity(0.22),
                  resolved.withOpacity(0.10),
                ],
              ),
              border: Border.all(color: resolved.withOpacity(0.25)),
            ),
            child: Icon(icon, color: resolved),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: scheme.onSurfaceVariant,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SfBarChart extends StatelessWidget {
  const SfBarChart({
    super.key,
    required this.values,
    required this.labels,
    required this.title,
    required this.subtitle,
    this.maxValue = 100,
  });

  final List<double> values;
  final List<String> labels;
  final String title;
  final String subtitle;
  final double maxValue;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (values.isEmpty || labels.isEmpty) {
      return SfPanelCard(
        child: SfSectionHeader(title: title, subtitle: subtitle),
      );
    }

    final safeMax = maxValue <= 0 ? 1.0 : maxValue;

    return SfPanelCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SfSectionHeader(title: title, subtitle: subtitle),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: CustomPaint(
              painter: _SfBarChartPainter(
                values: values,
                labels: labels,
                maxValue: safeMax,
                barColor: scheme.primary,
                gridColor: scheme.outline.withOpacity(isDark ? 0.34 : 0.45),
                textColor: scheme.onSurfaceVariant,
              ),
              child: const SizedBox.expand(),
            ),
          ),
        ],
      ),
    );
  }
}

class _SfBarChartPainter extends CustomPainter {
  _SfBarChartPainter({
    required this.values,
    required this.labels,
    required this.maxValue,
    required this.barColor,
    required this.gridColor,
    required this.textColor,
  });

  final List<double> values;
  final List<String> labels;
  final double maxValue;
  final Color barColor;
  final Color gridColor;
  final Color textColor;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final grid = Paint()
      ..color = gridColor
      ..strokeWidth = 1;

    const double leftPad = 10;
    const double rightPad = 10;
    const double topPad = 6;
    const double bottomPad = 34;

    final chartWidth = (size.width - leftPad - rightPad).clamp(1.0, size.width).toDouble();
    final chartHeight = (size.height - topPad - bottomPad).clamp(1.0, size.height).toDouble();

    // Grid lines (0/25/50/75/100)
    for (int i = 0; i <= 4; i++) {
      final y = topPad + chartHeight * (i / 4);
      canvas.drawLine(Offset(leftPad, y), Offset(size.width - rightPad, y), grid);
    }

    final n = values.length <= labels.length ? values.length : labels.length;
    if (n <= 0) return;

    final gap = 10.0;
    final totalGap = gap * (n - 1);
    final rawBarWidth = (chartWidth - totalGap) / n;
    final barWidth = rawBarWidth.clamp(8.0, 54.0).toDouble();
    final maxBarsWidth = barWidth * n + totalGap;
    final startX = leftPad + (chartWidth - maxBarsWidth) / 2;

    final textStyle = TextStyle(
      color: textColor,
      fontSize: 10,
      fontWeight: FontWeight.w700,
    );
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i < n; i++) {
      final v = values[i].isFinite ? values[i] : 0.0;
      final normalized = (v / maxValue).clamp(0.0, 1.0);
      final barH = chartHeight * normalized;
      final x = startX + i * (barWidth + gap);
      final y = topPad + (chartHeight - barH);

      final rrect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, y, barWidth, barH),
        const Radius.circular(10),
      );
      paint.color = barColor.withOpacity(0.85);
      canvas.drawRRect(rrect, paint);

      // Value label (top)
      textPainter.text = TextSpan(text: v.toStringAsFixed(0), style: textStyle);
      textPainter.layout(maxWidth: barWidth);
      textPainter.paint(canvas, Offset(x + (barWidth - textPainter.width) / 2, y - 14));

      // X label (bottom, truncated)
      final raw = labels[i];
      final label = raw.length > 10 ? '${raw.substring(0, 10)}…' : raw;
      textPainter.text = TextSpan(text: label, style: textStyle);
      textPainter.layout(maxWidth: barWidth + 6);
      textPainter.paint(
        canvas,
        Offset(x + (barWidth - textPainter.width) / 2, topPad + chartHeight + 10),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _SfBarChartPainter oldDelegate) {
    return oldDelegate.values != values ||
        oldDelegate.labels != labels ||
        oldDelegate.maxValue != maxValue ||
        oldDelegate.barColor != barColor ||
        oldDelegate.gridColor != gridColor ||
        oldDelegate.textColor != textColor;
  }
}
