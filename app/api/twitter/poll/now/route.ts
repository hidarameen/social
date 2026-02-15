import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Twitter polling endpoint is deprecated. Use webhook ingestion at /api/twitter/webhook.',
    },
    { status: 410 }
  );
}
