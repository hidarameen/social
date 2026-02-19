import 'package:flutter/material.dart';

String normalizePlatformId(String platformId) {
  return platformId.trim().toLowerCase();
}

IconData platformBrandIcon(String platformId) {
  final normalized = normalizePlatformId(platformId);
  if (normalized.isEmpty) return Icons.public_rounded;
  if (normalized.contains('telegram')) return Icons.send_rounded;
  if (normalized.contains('twitter') ||
      normalized == 'x' ||
      normalized.contains('x.com')) {
    return Icons.alternate_email_rounded;
  }
  if (normalized.contains('youtube')) return Icons.ondemand_video_rounded;
  if (normalized.contains('tiktok')) return Icons.music_note_rounded;
  if (normalized.contains('instagram')) return Icons.camera_alt_rounded;
  if (normalized.contains('facebook')) return Icons.facebook_rounded;
  if (normalized.contains('linkedin')) return Icons.business_center_rounded;
  if (normalized.contains('snap')) return Icons.chat_bubble_rounded;
  if (normalized.contains('threads')) return Icons.forum_rounded;
  if (normalized.contains('reddit')) return Icons.forum_rounded;
  if (normalized.contains('pinterest')) return Icons.push_pin_rounded;
  return Icons.public_rounded;
}

Color platformBrandColor(
  String platformId, {
  required ColorScheme scheme,
  required bool isDark,
}) {
  final normalized = normalizePlatformId(platformId);
  if (normalized.isEmpty) return scheme.primary;
  if (normalized.contains('telegram')) return const Color(0xFF229ED9);
  if (normalized.contains('facebook')) return const Color(0xFF1877F2);
  if (normalized.contains('instagram')) return const Color(0xFFE4405F);
  if (normalized.contains('youtube')) return const Color(0xFFFF0000);
  if (normalized.contains('tiktok')) return const Color(0xFFFE2C55);
  if (normalized.contains('linkedin')) return const Color(0xFF0A66C2);
  if (normalized.contains('pinterest')) return const Color(0xFFE60023);
  if (normalized.contains('reddit')) return const Color(0xFFFF4500);
  if (normalized.contains('snap')) return const Color(0xFFFBCB00);
  if (normalized.contains('threads')) {
    return isDark ? const Color(0xFFEDEDED) : const Color(0xFF111111);
  }
  if (normalized.contains('twitter') ||
      normalized == 'x' ||
      normalized.contains('x.com')) {
    return isDark ? const Color(0xFFE7E9EA) : const Color(0xFF111111);
  }
  return scheme.primary;
}
