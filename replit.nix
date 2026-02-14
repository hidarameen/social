{ pkgs }: {
  deps = [
    pkgs."telegram-bot-api"
    pkgs.ffmpeg
    pkgs.yt-dlp
    pkgs.curl
    pkgs.jq
    pkgs.docker
    pkgs.docker-compose
  ];
}
