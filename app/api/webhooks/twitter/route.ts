import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Twitter CRC (Challenge Response Check) validation
export async function GET(req: NextRequest) {
  const crc_token = req.nextUrl.searchParams.get('crc_token');
  
  if (crc_token) {
    const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
    if (!consumerSecret) {
      return NextResponse.json({ error: 'Missing TWITTER_CONSUMER_SECRET' }, { status: 500 });
    }

    const hash = crypto
      .createHmac('sha256', consumerSecret)
      .update(crc_token)
      .digest('base64');

    return NextResponse.json({
      response_token: `sha256=${hash}`
    });
  }

  return NextResponse.json({ message: 'Twitter Webhook Endpoint' });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[TwitterWebhook] Received event:', JSON.stringify(payload, null, 2));
    
    // logic to handle account_activity events
    // For now, we just log it. In a real scenario, we would parse tweet_create_events etc.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TwitterWebhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
