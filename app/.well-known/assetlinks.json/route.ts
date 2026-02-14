import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readFingerprints() {
  const raw =
    process.env.ANDROID_TWA_SHA256_CERT_FINGERPRINTS ||
    process.env.ANDROID_TWA_SHA256_CERT_FINGERPRINT ||
    '';

  return raw
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET() {
  const packageName = (process.env.ANDROID_TWA_PACKAGE_NAME || '').trim();
  const fingerprints = readFingerprints();

  if (!packageName || fingerprints.length === 0) {
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}
