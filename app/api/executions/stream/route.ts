import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { executionEvents } from '@/lib/services/execution-events';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let abortHandler: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: Record<string, unknown>) => {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      const cleanup = () => {
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        if (abortHandler) {
          request.signal.removeEventListener('abort', abortHandler);
          abortHandler = null;
        }
      };

      send('ready', { at: Date.now() });
      unsubscribe = executionEvents.subscribeChanged((payload) => {
        send('execution-changed', payload);
      });

      heartbeat = setInterval(() => {
        send('heartbeat', { at: Date.now() });
      }, 15_000);

      abortHandler = () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      };
      request.signal.addEventListener('abort', abortHandler);
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (abortHandler) {
        request.signal.removeEventListener('abort', abortHandler);
        abortHandler = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
