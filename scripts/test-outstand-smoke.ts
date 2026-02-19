import assert from 'node:assert/strict';
import { getPlatformApiProvider } from '@/lib/platforms/provider';
import { outstandingTwitterHandler } from '@/lib/platforms/outstanding/twitter';
import { outstandingPlatformHandlers } from '@/lib/platforms/outstanding';
import { PlatformManager } from '@/lib/platform-manager';
import type { ContentItem, PlatformAccount } from '@/lib/types';
import type { PlatformId, PostRequest } from '@/lib/platforms/types';

type EnvPatch = Record<string, string | undefined>;

type FetchCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyText: string;
};

function patchEnv(patch: EnvPatch): () => void {
  const prev = new Map<string, string | undefined>();
  for (const key of Object.keys(patch)) {
    prev.set(key, process.env[key]);
    const value = patch[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return () => {
    for (const [key, value] of prev.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

function normalizeHeaders(input: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input) return out;
  const headers = new Headers(input);
  for (const [key, value] of headers.entries()) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

function createFetchMock() {
  const calls: FetchCall[] = [];

  const mock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const parsed = new URL(url);
    const method = String(init?.method || 'GET').toUpperCase();
    const headers = normalizeHeaders(init?.headers);
    const bodyText =
      typeof init?.body === 'string'
        ? init.body
        : init?.body instanceof URLSearchParams
          ? init.body.toString()
          : '';

    calls.push({ url, method, headers, bodyText });

    if (!headers.authorization?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ message: 'Missing bearer token' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (parsed.pathname.endsWith('/social-accounts') && method === 'GET') {
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 'acc_1',
              network: 'x',
              username: 'demo_x',
              name: 'Demo X',
              stats: { followers: 10, following: 5 },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (parsed.pathname.endsWith('/posts') && method === 'POST') {
      const payload = bodyText ? JSON.parse(bodyText) : {};
      return new Response(
        JSON.stringify({
          success: true,
          post: {
            id: 'post_1',
            scheduledAt: payload.scheduledAt,
            socialAccounts: [
              {
                accountId: payload.accounts?.[0] || 'acc_1',
                network: 'x',
                platformPostId: '1900000000000000000',
              },
            ],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ message: `Unhandled route ${method} ${parsed.pathname}` }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  };

  return { calls, mock };
}

async function testProviderResolution(): Promise<void> {
  {
    const restore = patchEnv({
      SOCIAL_API_PROVIDER: 'native',
      OUTSTAND_PLATFORMS: 'twitter,facebook',
      SOCIAL_API_PROVIDER_FACEBOOK: undefined,
    });
    try {
      assert.equal(getPlatformApiProvider('twitter'), 'outstanding');
      assert.equal(getPlatformApiProvider('facebook'), 'outstanding');
      assert.equal(getPlatformApiProvider('youtube'), 'native');
      assert.equal(getPlatformApiProvider('instagram'), 'native');
    } finally {
      restore();
    }
  }

  {
    const restore = patchEnv({
      SOCIAL_API_PROVIDER: 'native',
      OUTSTAND_PLATFORMS: 'x,linkedin',
    });
    try {
      assert.equal(getPlatformApiProvider('twitter'), 'outstanding');
      assert.equal(getPlatformApiProvider('linkedin'), 'outstanding');
      assert.equal(getPlatformApiProvider('facebook'), 'native');
    } finally {
      restore();
    }
  }

  {
    const restore = patchEnv({
      SOCIAL_API_PROVIDER: 'native',
      OUTSTAND_PLATFORMS: 'twitter',
      SOCIAL_API_PROVIDER_FACEBOOK: 'outstanding',
    });
    try {
      assert.equal(getPlatformApiProvider('twitter'), 'outstanding');
      assert.equal(getPlatformApiProvider('facebook'), 'outstanding');
      assert.equal(getPlatformApiProvider('youtube'), 'native');
    } finally {
      restore();
    }
  }

  {
    const restore = patchEnv({
      SOCIAL_API_PROVIDER: 'outstanding',
      OUTSTAND_PLATFORMS: '',
    });
    try {
      assert.equal(getPlatformApiProvider('twitter'), 'outstanding');
      assert.equal(getPlatformApiProvider('facebook'), 'outstanding');
      assert.equal(getPlatformApiProvider('youtube'), 'outstanding');
    } finally {
      restore();
    }
  }
}

async function testOutstandingHandlerPublishAndAccountInfo(): Promise<void> {
  const restoreEnv = patchEnv({
    OUTSTAND_API_KEY: 'test_key',
    OUTSTAND_API_BASE_URL: 'https://api.outstand.so/v1',
    OUTSTAND_X_ACCOUNTS: '',
  });

  const originalFetch = global.fetch;
  const { calls, mock } = createFetchMock();
  global.fetch = mock as typeof fetch;

  try {
    const publishResult = await outstandingTwitterHandler.publishPost(
      { content: 'hello outstand' },
      JSON.stringify({ accountId: 'acc_1' })
    );

    assert.equal(publishResult.success, true);
    assert.equal(publishResult.postId, 'post_1');
    assert.match(String(publishResult.url || ''), /x\.com/i);

    const accountInfo = await outstandingTwitterHandler.getAccountInfo(
      JSON.stringify({ accountId: 'acc_1' })
    );

    assert.ok(accountInfo);
    assert.equal(accountInfo?.id, 'acc_1');
    assert.equal(accountInfo?.username, 'demo_x');

    const postCall = calls.find((item) => item.url.endsWith('/v1/posts'));
    assert.ok(postCall, 'Expected /posts call to be executed');
    const parsed = JSON.parse(postCall!.bodyText);
    assert.deepEqual(parsed.accounts, ['acc_1']);
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
}

async function testOutstandingHandlerMissingKey(): Promise<void> {
  const restoreEnv = patchEnv({
    OUTSTAND_API_KEY: undefined,
    OUTSTANDING_API_KEY: undefined,
  });

  try {
    const result = await outstandingTwitterHandler.publishPost(
      { content: 'missing key check' },
      JSON.stringify({ accountId: 'acc_1' })
    );

    assert.equal(result.success, false);
    assert.match(String(result.error || ''), /Missing Outstand API key/i);
  } finally {
    restoreEnv();
  }
}

async function testPlatformManagerOutstandingPath(): Promise<void> {
  const restoreEnv = patchEnv({
    SOCIAL_API_PROVIDER: 'native',
    OUTSTAND_PLATFORMS: 'twitter',
    OUTSTAND_API_KEY: 'test_key',
    OUTSTAND_API_BASE_URL: 'https://api.outstand.so/v1',
  });

  const originalFetch = global.fetch;
  const { calls, mock } = createFetchMock();
  global.fetch = mock as typeof fetch;

  try {
    const manager = new PlatformManager();
    const account: PlatformAccount = {
      id: 'local_acc_1',
      userId: 'u1',
      platform: 'twitter',
      accountId: 'acc_1',
      username: 'demo_x',
      displayName: 'Demo X',
      authType: 'manual',
      isActive: true,
      errorCount: 0,
      credentials: {
        accessToken: 'token_1',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const content: ContentItem = {
      type: 'text',
      text: 'manager publish',
    };

    const result = await manager.publishContent(account, content);
    assert.equal(result.success, true);
    assert.equal(result.postId, 'post_1');

    const postCall = calls.find((item) => item.url.endsWith('/v1/posts'));
    assert.ok(postCall, 'Expected manager to publish through Outstand /posts');
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
}

async function testAllOutstandingPlatformHandlersPublish(): Promise<void> {
  const restoreEnv = patchEnv({
    OUTSTAND_API_KEY: 'test_key',
    OUTSTAND_API_BASE_URL: 'https://api.outstand.so/v1',
    OUTSTAND_X_ACCOUNTS: '',
    OUTSTAND_FACEBOOK_ACCOUNTS: '',
    OUTSTAND_INSTAGRAM_ACCOUNTS: '',
    OUTSTAND_TIKTOK_ACCOUNTS: '',
    OUTSTAND_YOUTUBE_ACCOUNTS: '',
    OUTSTAND_TELEGRAM_ACCOUNTS: '',
    OUTSTAND_LINKEDIN_ACCOUNTS: '',
  });

  const originalFetch = global.fetch;
  const { calls, mock } = createFetchMock();
  global.fetch = mock as typeof fetch;

  try {
    const post: PostRequest = {
      content: 'all-handlers-check',
      media: { type: 'image', url: 'https://example.com/media.jpg' },
    };

    const platformIds: PlatformId[] = [
      'facebook',
      'instagram',
      'twitter',
      'tiktok',
      'youtube',
      'telegram',
      'linkedin',
    ];

    for (const platformId of platformIds) {
      const handler = outstandingPlatformHandlers[platformId];
      const res = await handler.publishPost(post, JSON.stringify({ accountId: 'acc_1' }));
      assert.equal(res.success, true, `Expected success for ${platformId}`);
      assert.equal(res.postId, 'post_1', `Expected post ID for ${platformId}`);
    }

    const postCalls = calls.filter((item) => item.url.endsWith('/v1/posts'));
    assert.equal(postCalls.length, platformIds.length);
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
}

async function main(): Promise<void> {
  await testProviderResolution();
  await testOutstandingHandlerPublishAndAccountInfo();
  await testOutstandingHandlerMissingKey();
  await testPlatformManagerOutstandingPath();
  await testAllOutstandingPlatformHandlersPublish();
  console.log('Outstand smoke tests passed.');
}

main().catch((error) => {
  console.error('Outstand smoke tests failed:', error);
  process.exitCode = 1;
});
