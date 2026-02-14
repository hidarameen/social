const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

function normalizePossibleUrl(value: string): string {
  return value.trim().replace(/[)\].,;!?]+$/, '');
}

function collectUrls(value: unknown, urls: string[], seen: Set<string>, depth = 0): void {
  if (depth > 5 || value == null) return;

  if (typeof value === 'string') {
    const normalized = normalizePossibleUrl(value);
    if (!/^https?:\/\//i.test(normalized)) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    urls.push(normalized);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value.slice(0, 50)) {
      collectUrls(item, urls, seen, depth + 1);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>).slice(0, 50)) {
      collectUrls(item, urls, seen, depth + 1);
    }
  }
}

function isYouTubeVideoUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (!YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) return false;

    if (parsed.hostname.toLowerCase() === 'youtu.be') {
      return parsed.pathname.length > 1;
    }

    return (
      parsed.pathname.startsWith('/watch') ||
      parsed.pathname.startsWith('/shorts/') ||
      parsed.pathname.startsWith('/live/')
    );
  } catch {
    return false;
  }
}

export function extractYouTubeVideoLinks(responseData: unknown): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  collectUrls(responseData, urls, seen);
  return urls.filter(isYouTubeVideoUrl);
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = normalizePossibleUrl(value);
  if (!/^https?:\/\//i.test(normalized)) return undefined;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function safeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function twitterStatusUrl(username: string | undefined, tweetId: string | undefined): string | undefined {
  if (!tweetId) return undefined;
  const cleanId = tweetId.trim();
  if (!cleanId) return undefined;
  if (username) {
    const cleanUsername = username.replace(/^@+/, '').trim();
    if (cleanUsername) {
      return `https://x.com/${encodeURIComponent(cleanUsername)}/status/${encodeURIComponent(cleanId)}`;
    }
  }
  return `https://x.com/i/web/status/${encodeURIComponent(cleanId)}`;
}

function firstDefinedUrl(values: unknown[]): string | undefined {
  for (const item of values) {
    const url = safeHttpUrl(item);
    if (url) return url;
  }
  return undefined;
}

export function extractExecutionMessageLinks(responseData: unknown): {
  sourceUrl?: string;
  targetUrl?: string;
} {
  const payload = (responseData && typeof responseData === 'object')
    ? (responseData as Record<string, unknown>)
    : {};

  const sourceTweetId = safeString(payload.sourceTweetId);
  const sourceUsername = safeString(payload.sourceUsername);
  const sourceUrl = firstDefinedUrl([
    payload.sourceUrl,
    payload.sourceLink,
    twitterStatusUrl(sourceUsername, sourceTweetId),
  ]);

  const targetUrlFromKnownKeys = firstDefinedUrl([
    payload.targetUrl,
    payload.targetLink,
    payload.url,
    (payload.youtube as Record<string, unknown> | undefined)?.url,
    (payload.facebook as Record<string, unknown> | undefined)?.url,
    (payload.actions as Record<string, unknown> | undefined)?.url,
    ((payload.actions as Record<string, unknown> | undefined)?.post as Record<string, unknown> | undefined)?.url,
    ((payload.actions as Record<string, unknown> | undefined)?.reply as Record<string, unknown> | undefined)?.url,
    ((payload.actions as Record<string, unknown> | undefined)?.quote as Record<string, unknown> | undefined)?.url,
  ]);

  const targetTweetId = safeString(
    ((payload.actions as Record<string, unknown> | undefined)?.post as Record<string, unknown> | undefined)?.id
  ) || safeString(
    ((payload.actions as Record<string, unknown> | undefined)?.reply as Record<string, unknown> | undefined)?.id
  ) || safeString(
    ((payload.actions as Record<string, unknown> | undefined)?.quote as Record<string, unknown> | undefined)?.id
  ) || safeString(payload.id);

  const targetUrlFromTweetId = twitterStatusUrl(undefined, targetTweetId);

  let targetUrl = targetUrlFromKnownKeys || targetUrlFromTweetId;

  if (!targetUrl) {
    const urls: string[] = [];
    const seen = new Set<string>();
    collectUrls(responseData, urls, seen);
    targetUrl = urls.find((url) => url !== sourceUrl);
  }

  return {
    sourceUrl,
    targetUrl,
  };
}
