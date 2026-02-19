import type {
  OutstandingCreatePostPayload,
  OutstandingEnvelope,
  OutstandingNetworkId,
  OutstandingPost,
  OutstandingSocialAccount,
} from './types';

const DEFAULT_OUTSTAND_BASE_URL = 'https://api.outstand.so/v1';

type RequestOptions = {
  apiKey?: string;
  allowMissingApiKey?: boolean;
};

type SocialNetworkRecord = {
  id: string;
  network: string;
  clientKey?: string;
};

function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBaseUrl(value?: string): string {
  const source = trimString(value) || DEFAULT_OUTSTAND_BASE_URL;
  return source.replace(/\/+$/, '');
}

function resolveApiKey(explicitApiKey?: string): string {
  const key =
    trimString(explicitApiKey) ||
    trimString(process.env.OUTSTAND_API_KEY) ||
    trimString(process.env.OUTSTANDING_API_KEY);
  return key;
}

function buildApiUrl(path: string): string {
  const base = normalizeBaseUrl(process.env.OUTSTAND_API_BASE_URL || process.env.OUTSTANDING_API_BASE_URL);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export class OutstandApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'OutstandApiError';
    this.status = status;
    this.details = details;
  }
}

function parseJsonResponse(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: any, fallback: string): string {
  const direct = trimString(payload?.message);
  if (direct) return direct;
  const errorMessage = trimString(payload?.error?.message);
  if (errorMessage) return errorMessage;
  const nested = trimString(payload?.data?.message);
  if (nested) return nested;
  return fallback;
}

export async function outstandRequest<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey && !options.allowMissingApiKey) {
    throw new OutstandApiError(
      'Missing Outstand API key. Set OUTSTAND_API_KEY (or OUTSTANDING_API_KEY).'
    );
  }

  const headers = new Headers(init.headers || {});
  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  });

  const rawText = await response.text();
  const payload = parseJsonResponse(rawText) ?? rawText;

  if (!response.ok) {
    const message = extractErrorMessage(
      payload,
      `Outstand API error: ${response.status} ${response.statusText}`
    );
    throw new OutstandApiError(message, response.status, payload);
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as { success?: boolean }).success === false
  ) {
    throw new OutstandApiError(extractErrorMessage(payload, 'Outstand API returned success=false'), response.status, payload);
  }

  return payload as T;
}

export function getOutstandTenantId(): string | undefined {
  const tenantId = trimString(process.env.OUTSTAND_TENANT_ID || process.env.OUTSTANDING_TENANT_ID);
  return tenantId || undefined;
}

export async function listOutstandSocialNetworks(apiKey?: string): Promise<SocialNetworkRecord[]> {
  const response = await outstandRequest<OutstandingEnvelope<SocialNetworkRecord[]>>('/social-networks', { method: 'GET' }, { apiKey });
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export async function ensureOutstandSocialNetworkConfigured(params: {
  network: OutstandingNetworkId;
  clientKey: string;
  clientSecret: string;
  apiKey?: string;
}): Promise<void> {
  const clientKey = trimString(params.clientKey);
  const clientSecret = trimString(params.clientSecret);
  if (!clientKey || !clientSecret) return;

  const existing = (await listOutstandSocialNetworks(params.apiKey)).find(
    (network) => trimString(network.network).toLowerCase() === params.network
  );

  if (existing?.id) {
    await outstandRequest(`/social-networks/${encodeURIComponent(existing.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        client_key: clientKey,
        client_secret: clientSecret,
      }),
    }, { apiKey: params.apiKey });
    return;
  }

  await outstandRequest('/social-networks', {
    method: 'POST',
    body: JSON.stringify({
      network: params.network,
      client_key: clientKey,
      client_secret: clientSecret,
    }),
  }, { apiKey: params.apiKey });
}

export async function getOutstandNetworkAuthUrl(params: {
  network: OutstandingNetworkId;
  redirectUri?: string;
  tenantId?: string;
  apiKey?: string;
}): Promise<string | undefined> {
  const response = await outstandRequest<OutstandingEnvelope<{ authUrl?: string }>>(
    '/social-accounts/auth-url',
    {
      method: 'POST',
      body: JSON.stringify({
        network: params.network,
        redirect_uri: trimString(params.redirectUri) || undefined,
        tenant_id: trimString(params.tenantId) || getOutstandTenantId(),
      }),
    },
    { apiKey: params.apiKey }
  );

  return trimString(response?.data?.authUrl) || undefined;
}

export async function listOutstandSocialAccounts(params?: {
  network?: OutstandingNetworkId;
  limit?: number;
  tenantId?: string;
  apiKey?: string;
}): Promise<OutstandingSocialAccount[]> {
  const query = new URLSearchParams();
  if (params?.network) query.set('network', params.network);
  if (typeof params?.limit === 'number' && Number.isFinite(params.limit) && params.limit > 0) {
    query.set('limit', String(Math.floor(params.limit)));
  }
  const tenantId = trimString(params?.tenantId) || getOutstandTenantId();
  if (tenantId) query.set('tenant_id', tenantId);

  const endpoint = query.toString() ? `/social-accounts?${query.toString()}` : '/social-accounts';
  const response = await outstandRequest<OutstandingEnvelope<OutstandingSocialAccount[]>>(endpoint, { method: 'GET' }, { apiKey: params?.apiKey });
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export async function createOutstandPost(
  payload: OutstandingCreatePostPayload,
  apiKey?: string
): Promise<OutstandingPost | undefined> {
  const response = await outstandRequest<OutstandingEnvelope<{ post?: OutstandingPost }> | OutstandingEnvelope<unknown>>(
    '/posts',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { apiKey }
  );

  const topLevel = (response as OutstandingEnvelope<unknown>)?.post;
  if (topLevel && typeof topLevel === 'object') return topLevel;

  const nested = (response as OutstandingEnvelope<{ post?: OutstandingPost }>)?.data?.post;
  if (nested && typeof nested === 'object') return nested;

  return undefined;
}

export async function getOutstandPost(postId: string, apiKey?: string): Promise<OutstandingPost | undefined> {
  const normalized = trimString(postId);
  if (!normalized) return undefined;

  const response = await outstandRequest<OutstandingEnvelope<{ post?: OutstandingPost }> | OutstandingEnvelope<unknown>>(
    `/posts/${encodeURIComponent(normalized)}`,
    { method: 'GET' },
    { apiKey }
  );

  const topLevel = (response as OutstandingEnvelope<unknown>)?.post;
  if (topLevel && typeof topLevel === 'object') return topLevel;

  const nested = (response as OutstandingEnvelope<{ post?: OutstandingPost }>)?.data?.post;
  if (nested && typeof nested === 'object') return nested;

  return undefined;
}

export async function deleteOutstandPost(postId: string, apiKey?: string): Promise<boolean> {
  const normalized = trimString(postId);
  if (!normalized) return false;

  await outstandRequest(`/posts/${encodeURIComponent(normalized)}`, { method: 'DELETE' }, { apiKey });
  return true;
}

export async function getOutstandSocialAccountMetrics(
  socialAccountId: string,
  params: { since?: Date; until?: Date; apiKey?: string } = {}
): Promise<any> {
  const normalizedId = trimString(socialAccountId);
  if (!normalizedId) return null;

  const query = new URLSearchParams();
  if (params.since instanceof Date && !Number.isNaN(params.since.getTime())) {
    query.set('since', params.since.toISOString());
  }
  if (params.until instanceof Date && !Number.isNaN(params.until.getTime())) {
    query.set('until', params.until.toISOString());
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await outstandRequest<OutstandingEnvelope<any>>(
    `/social-accounts/${encodeURIComponent(normalizedId)}/metrics${suffix}`,
    { method: 'GET' },
    { apiKey: params.apiKey }
  );

  return response?.data ?? response;
}

export async function deleteOutstandSocialAccount(
  socialAccountId: string,
  apiKey?: string
): Promise<boolean> {
  const normalizedId = trimString(socialAccountId);
  if (!normalizedId) return false;

  await outstandRequest(
    `/social-accounts/${encodeURIComponent(normalizedId)}`,
    { method: 'DELETE' },
    { apiKey }
  );
  return true;
}

export function parseOutstandNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function normalizeSelector(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase();
}
