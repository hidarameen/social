import { ensureTwitterPollingStarted } from '@/lib/services/twitter-poller';
import { ensureTwitterStreamStarted } from '@/lib/services/twitter-stream';
import { ensureSchedulerStarted } from '@/lib/services/task-scheduler';
import { ensureTelegramRealtimeStarted } from '@/lib/services/telegram-realtime';

const REFRESH_COOLDOWN_MS = 20_000;

let inFlight: Promise<void> | null = null;
let lastRunAt = 0;

async function refreshBackgroundServices() {
  await Promise.allSettled([
    ensureTwitterPollingStarted(),
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
