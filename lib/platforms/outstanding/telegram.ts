import type { PlatformConfig } from '../types';
import { OutstandingPlatformHandler } from './base-handler';

const config: PlatformConfig = {
  id: 'telegram',
  name: 'Telegram',
  icon: '✈️',
  color: '#0088cc',
  apiUrl: 'https://api.outstand.so/v1',
  supportedContentTypes: ['text', 'image', 'video'],
  maxContentLength: 4096,
  requiresMediaUpload: true,
  supportsScheduling: true,
  supportsRecurring: false,
  supportsAnalytics: true,
};

export const outstandingTelegramHandler = new OutstandingPlatformHandler({
  config,
  network: 'telegram',
  selectorsEnvKey: 'OUTSTAND_TELEGRAM_ACCOUNTS',
});
