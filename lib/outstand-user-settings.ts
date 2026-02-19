import { db } from '@/lib/db';
import type { PlatformId } from '@/lib/platforms/types';

export const OUTSTAND_SETTINGS_PLATFORM_ID = 'outstanding';

const PLATFORM_TOKEN_MAP: Record<string, PlatformId> = {
  facebook: 'facebook',
  instagram: 'instagram',
  twitter: 'twitter',
  x: 'twitter',
  tiktok: 'tiktok',
  youtube: 'youtube',
  telegram: 'telegram',
  linkedin: 'linkedin',
};

export const ALL_OUTSTAND_PLATFORM_IDS: PlatformId[] = [
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
  'telegram',
  'linkedin',
];

export type OutstandUserSettings = {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  tenantId?: string;
  platforms: PlatformId[];
  applyToAllAccounts: boolean;
};

type UpsertOutstandUserSettingsInput = {
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
  tenantId?: string;
  platforms?: string[];
  applyToAllAccounts?: boolean;
};

function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
      return true;
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
      return false;
    }
  }
  return fallback;
}

function parsePlatformList(value: unknown): PlatformId[] {
  const tokens: string[] = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = trimString(item).toLowerCase();
      if (normalized) tokens.push(normalized);
    }
  } else {
    const raw = trimString(value);
    if (raw) {
      for (const item of raw.split(/[\s,;|]+/)) {
        const normalized = item.trim().toLowerCase();
        if (normalized) tokens.push(normalized);
      }
    }
  }

  const set = new Set<PlatformId>();
  for (const token of tokens) {
    const mapped = PLATFORM_TOKEN_MAP[token];
    if (mapped) set.add(mapped);
  }

  return [...set];
}

function normalizeSettings(raw: Record<string, unknown>): OutstandUserSettings {
  const platforms = parsePlatformList(raw.platforms);
  return {
    enabled: parseBoolean(raw.enabled, false),
    apiKey: trimString(raw.apiKey) || undefined,
    baseUrl: trimString(raw.baseUrl) || undefined,
    tenantId: trimString(raw.tenantId) || undefined,
    platforms,
    applyToAllAccounts: parseBoolean(raw.applyToAllAccounts, true),
  };
}

function serializeSettings(input: UpsertOutstandUserSettingsInput): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (typeof input.enabled === 'boolean') output.enabled = input.enabled;
  if (typeof input.applyToAllAccounts === 'boolean') output.applyToAllAccounts = input.applyToAllAccounts;

  if (typeof input.apiKey === 'string') output.apiKey = input.apiKey.trim();
  if (typeof input.baseUrl === 'string') output.baseUrl = input.baseUrl.trim();
  if (typeof input.tenantId === 'string') output.tenantId = input.tenantId.trim();
  if (Array.isArray(input.platforms)) output.platforms = parsePlatformList(input.platforms);

  return output;
}

export function isOutstandEnabledForPlatform(settings: OutstandUserSettings, platformId: PlatformId): boolean {
  if (!settings.enabled) return false;
  if (settings.platforms.length === 0) return false;
  return settings.platforms.includes(platformId);
}

export async function getOutstandUserSettings(userId: string): Promise<OutstandUserSettings> {
  const record = await db.getUserPlatformCredential(userId, OUTSTAND_SETTINGS_PLATFORM_ID);
  const raw = (record?.credentials || {}) as Record<string, unknown>;
  return normalizeSettings(raw);
}

export async function upsertOutstandUserSettings(
  userId: string,
  input: UpsertOutstandUserSettingsInput
): Promise<OutstandUserSettings> {
  const current = await getOutstandUserSettings(userId);
  const updates = serializeSettings(input);
  const mergedRaw: Record<string, unknown> = {
    enabled: current.enabled,
    apiKey: current.apiKey || '',
    baseUrl: current.baseUrl || '',
    tenantId: current.tenantId || '',
    platforms: current.platforms,
    applyToAllAccounts: current.applyToAllAccounts,
    ...updates,
  };

  const saved = await db.upsertUserPlatformCredential({
    userId,
    platformId: OUTSTAND_SETTINGS_PLATFORM_ID,
    credentials: mergedRaw,
  });

  return normalizeSettings((saved.credentials || {}) as Record<string, unknown>);
}

export function createOutstandPublishToken(params: {
  userId?: string;
  apiKey?: string;
  tenantId?: string;
  baseUrl?: string;
}): string {
  const payload: Record<string, string> = {};
  const userId = trimString(params.userId);
  const apiKey = trimString(params.apiKey);
  const tenantId = trimString(params.tenantId);
  const baseUrl = trimString(params.baseUrl);

  if (userId) payload.userId = userId;
  if (apiKey) payload.apiKey = apiKey;
  if (tenantId) payload.tenantId = tenantId;
  if (baseUrl) payload.baseUrl = baseUrl;

  return JSON.stringify(payload);
}
