import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEPRECATION_ERROR =
  'Deprecated webhook endpoint. Use /api/twitter/webhook with Twitter signature verification.';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ success: false, error: DEPRECATION_ERROR }, { status: 410 });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: false, error: DEPRECATION_ERROR }, { status: 410 });
}
