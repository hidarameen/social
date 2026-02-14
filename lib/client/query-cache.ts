type CacheEntry<T> = {
  value: T;
  storedAt: number;
};

const queryCache = new Map<string, CacheEntry<unknown>>();

export function getCachedQuery<T>(key: string, maxAgeMs: number): T | undefined {
  const entry = queryCache.get(key);
  if (!entry) return undefined;

  const age = Date.now() - entry.storedAt;
  if (age > maxAgeMs) {
    queryCache.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function setCachedQuery<T>(key: string, value: T): void {
  queryCache.set(key, {
    value,
    storedAt: Date.now(),
  });
}
