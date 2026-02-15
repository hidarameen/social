import { debugEnabled, debugLog } from '@/lib/debug';

export type VideoProgressContext = {
  flow: string;
  platform?: string;
  taskId?: string;
  targetId?: string;
  onProgress?: (update: {
    percent: number;
    currentStep: number;
    totalSteps: number;
    stage: string;
    meta?: Record<string, any>;
  }) => void | Promise<void>;
};

const ASCII_SPINNER = ['|', '/', '-', '\\'];

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function buildProgressBar(percent: number, width = 20): string {
  const safePercent = clampPercent(percent);
  const filled = Math.round((safePercent / 100) * width);
  const empty = Math.max(0, width - filled);
  return `[${'#'.repeat(filled)}${'-'.repeat(empty)}]`;
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value || '');
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function formatCounterValue(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  if (value <= 9999) return String(Math.trunc(value));
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  return `${size.toFixed(idx === 0 ? 0 : 1)}${units[idx]}`;
}

function buildScope(context: VideoProgressContext): string {
  return [context.flow, context.platform].filter(Boolean).join('/');
}

export function createVideoProgressLogger(context: VideoProgressContext) {
  let lastLoggedPercent = -1;
  let lastLoggedAt = 0;
  let lastLoggedCurrent = -1;
  let lastProgressPercent = -1;
  let lastProgressAt = 0;
  let lastProgressCurrent = -1;
  let inlineLineLength = 0;
  let spinnerIndex = 0;
  const minPercentDelta = parsePositiveNumber(process.env.VIDEO_PROGRESS_MIN_PERCENT_DELTA, 2);
  const minIntervalMs = parsePositiveNumber(process.env.VIDEO_PROGRESS_MIN_INTERVAL_MS, 800);
  const minProgressPercentDelta = parsePositiveNumber(
    process.env.VIDEO_PROGRESS_CALLBACK_MIN_PERCENT_DELTA,
    1
  );
  const minProgressIntervalMs = parsePositiveNumber(
    process.env.VIDEO_PROGRESS_CALLBACK_MIN_INTERVAL_MS,
    300
  );
  const inlineEnabled =
    process.env.VIDEO_PROGRESS_INLINE !== 'false' &&
    Boolean(process.stdout?.isTTY) &&
    Boolean(process.stderr?.isTTY);

  return (
    currentStep: number,
    totalSteps: number,
    stage: string,
    meta?: Record<string, any>
  ) => {
    const safeTotal = Math.max(1, Math.trunc(totalSteps || 1));
    const safeCurrent = Math.min(safeTotal, Math.max(0, Math.trunc(currentStep || 0)));
    const percent = clampPercent((safeCurrent / safeTotal) * 100);
    const now = Date.now();
    const isFinal = safeCurrent >= safeTotal;
    const progressed = safeCurrent > lastProgressCurrent;

    const shouldEmitProgress =
      safeTotal <= 1000 ||
      isFinal ||
      (progressed && percent - lastProgressPercent >= minProgressPercentDelta) ||
      (progressed && now - lastProgressAt >= minProgressIntervalMs);

    if (shouldEmitProgress && context.onProgress) {
      lastProgressPercent = percent;
      lastProgressAt = now;
      lastProgressCurrent = safeCurrent;
      try {
        const maybePromise = context.onProgress({
          percent,
          currentStep: safeCurrent,
          totalSteps: safeTotal,
          stage: String(stage || 'progress'),
          meta,
        });
        if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
          void (maybePromise as Promise<void>).catch(() => undefined);
        }
      } catch {
        // non-blocking progress callbacks should never break processing flows
      }
    }

    // Byte-sized totals (resumable chunk uploads) can emit thousands of updates.
    // Throttle logs to keep upload throughput high and logs readable.
    if (safeTotal > 1000) {
      const percentAdvanced = percent - lastLoggedPercent;
      const loggedProgressed = safeCurrent > lastLoggedCurrent;
      const elapsed = now - lastLoggedAt;
      const shouldLog =
        isFinal ||
        (loggedProgressed && percentAdvanced >= minPercentDelta) ||
        (loggedProgressed && elapsed >= minIntervalMs);
      if (!shouldLog) {
        return;
      }
    }

    if (!debugEnabled()) return;

    lastLoggedPercent = percent;
    lastLoggedAt = now;
    lastLoggedCurrent = safeCurrent;

    const counter =
      safeTotal > 1000
        ? `${formatCounterValue(safeCurrent)}/${formatCounterValue(safeTotal)}`
        : `${safeCurrent}/${safeTotal}`;
    const bar = buildProgressBar(percent, safeTotal > 1000 ? 24 : 20);
    const scope = buildScope(context);
    const stageLabel = String(stage || 'progress').replace(/[-_]+/g, ' ');
    const spinner = ASCII_SPINNER[spinnerIndex % ASCII_SPINNER.length];
    spinnerIndex += 1;
    const line = `${spinner} ${scope} ${stageLabel} ${bar} ${String(percent).padStart(3, ' ')}% ${counter}`;

    if (inlineEnabled) {
      const padded = line.length < inlineLineLength ? line.padEnd(inlineLineLength, ' ') : line;
      process.stdout.write(`\r[DEBUG] ${padded}`);
      inlineLineLength = Math.max(inlineLineLength, line.length);

      if (isFinal) {
        process.stdout.write('\n');
        inlineLineLength = 0;
      }
      return;
    }

    debugLog(`Video progress ${scope} ${stageLabel} ${bar} ${String(percent).padStart(3, ' ')}% ${counter}`);
  };
}
