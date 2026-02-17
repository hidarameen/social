import 'package:flutter/foundation.dart';

class AppConfig {
  // Set by build arg:
  // flutter build apk --dart-define=APP_URL=https://your-domain/
  static const String _rawAppUrl = String.fromEnvironment(
    'APP_URL',
    defaultValue: '',
  );

  // Local fallback for debug only. Production Docker build should pass APP_URL.
  // Android emulator cannot access host services through 127.0.0.1.
  static const String _androidEmulatorFallbackUrl = 'http://10.0.2.2:5000/';
  static const String _defaultDebugFallbackUrl = 'http://127.0.0.1:5000/';

  static String _normalizeUrl(String input) {
    final trimmed = input.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return 'https://$trimmed';
  }

  static String get appUrl {
    final value = _rawAppUrl.trim();
    if (value.isEmpty) {
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
        return _normalizeUrl(_androidEmulatorFallbackUrl);
      }
      return _normalizeUrl(_defaultDebugFallbackUrl);
    }
    return _normalizeUrl(value);
  }

  static Uri get baseUri {
    return Uri.parse(appUrl);
  }

  static Uri resolvePath(String path) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final base = baseUri;
    final trimmedBasePath = base.path == '/'
        ? ''
        : base.path.replaceAll(RegExp(r'/+$'), '');
    final fullPath = '$trimmedBasePath$normalizedPath';
    return base.replace(path: fullPath, query: null, fragment: null);
  }
}
