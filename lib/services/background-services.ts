import { ensureTwitterStreamStarted } from '@/lib/services/twitter-stream';
import { ensureSchedulerStarted } from '@/lib/services/task-scheduler';
import { telegramPoller } from '@/lib/services/telegram-poller';
import { ensureTelegramRealtimeStarted } from '@/lib/services/telegram-realtime';

const REFRESH_COOLDOWN_MS = 20_000;

let inFlight: Promise<void> | null = null;
let lastRunAt = 0;

async function refreshBackgroundServices() {
  // Telegram ingestion is realtime event-based only (no polling bootstrap).
  telegramPoller.stop();
  await Promise.allSettled([
    ensureTwitterStreamStarted(),
    ensureTelegramRealtimeStarted(),
  ]);
  ensureSchedulerStarted();
}

export function triggerBackgroundServicesRefresh(options?: { force?: boolean }) {
  const now = Date.now();
  const force = options?.force === true;

  if (!force && now - lastRunAt < REFRESH_COOLDOWN_MS) {
    return;
  }
  if (inFlight) {
    return;
  }

  inFlight = refreshBackgroundServices()
    .catch((error) => {
      console.error('[BackgroundServices] Refresh failed:', error);
    })
    .finally(() => {
      lastRunAt = Date.now();
      inFlight = null;
    });
}
