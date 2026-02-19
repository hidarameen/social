import type { PlatformConfig } from '../types';
import { OutstandingPlatformHandler } from './base-handler';

const config: PlatformConfig = {
  id: 'tiktok',
  name: 'TikTok',
  icon: '🎵',
  color: '#000000',
  apiUrl: 'https://api.outstand.so/v1',
  supportedContentTypes: ['video', 'text'],
  maxContentLength: 5000,
  requiresMediaUpload: true,
  supportsScheduling: true,
  supportsRecurring: false,
  supportsAnalytics: true,
};

export const outstandingTikTokHandler = new OutstandingPlatformHandler({
  config,
  network: 'tiktok',
  selectorsEnvKey: 'OUTSTAND_TIKTOK_ACCOUNTS',
});
