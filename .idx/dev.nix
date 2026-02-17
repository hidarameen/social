{pkgs}: let
  flutter-apk-run = pkgs.writeShellApplication {
    name = "flutter-apk-run";
    runtimeInputs = [
      pkgs.android-tools # adb
      pkgs.coreutils
      pkgs.gawk
      pkgs.gnugrep
    ];
    text = ''
      set -euo pipefail

      apk="''${1:-}"
      pkg="''${2:-}"
      if [ -z "$pkg" ] && [ -n "''${ANDROID_PACKAGE:-}" ]; then
        pkg="$ANDROID_PACKAGE"
      fi

      if [ -z "$apk" ] || [ "$apk" = "-h" ] || [ "$apk" = "--help" ]; then
        cat >&2 <<'EOF'
Usage:
  flutter-apk-run <path-to.apk> [package.name]

Notes:
  - Requires a running Android emulator or a connected device (via adb).
  - If you omit package.name, you can also set ANDROID_PACKAGE env var.
EOF
        exit 2
      fi

      if [ ! -f "$apk" ]; then
        echo "APK not found: $apk" >&2
        exit 2
      fi

      if ! command -v adb >/dev/null 2>&1; then
        echo "adb not found. Ensure pkgs.android-tools is in your dev env." >&2
        exit 1
      fi

      adb start-server >/dev/null 2>&1 || true

      # Confirm we have at least one device.
      if ! adb get-state >/dev/null 2>&1; then
        echo "No adb device detected. Start an emulator or connect a device." >&2
        adb devices >&2 || true
        exit 1
      fi

      echo "Installing: $apk"
      adb install -r "$apk"

      if [ -z "$pkg" ]; then
        # Best-effort package name detection (only if aapt is available).
        if command -v aapt >/dev/null 2>&1; then
          pkg="$(aapt dump badging "$apk" 2>/dev/null | awk -F"'" '/^package: name=/{print $2; exit}')"
        fi
      fi

      if [ -z "$pkg" ]; then
        cat >&2 <<EOF
Installed, but package name is unknown.
Re-run with an explicit package name, for example:
  flutter-apk-run "$apk" com.example.app
or set:
  export ANDROID_PACKAGE=com.example.app
EOF
        exit 0
      fi

      echo "Launching: $pkg"
      adb shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 \
        || adb shell am start -n "$pkg/.MainActivity" >/dev/null 2>&1 \
        || {
          echo "Installed, but failed to launch $pkg automatically." >&2
          exit 1
        }
    '';
  };
in {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    # Needed for Android/Gradle builds in Flutter preview.
    pkgs.jdk17
    pkgs.unzip
    pkgs.android-tools
    flutter-apk-run
  ];
  idx.extensions = [
    
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };

      # Firebase Studio Android emulator preview (Flutter).
      # The Flutter project lives under flutter_app/.
      android = {
        manager = "flutter";
        cwd = "flutter_app";
      };
    };
  };
}
