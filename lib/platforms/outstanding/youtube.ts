import type { PlatformConfig } from '../types';
import { OutstandingPlatformHandler } from './base-handler';

const config: PlatformConfig = {
  id: 'youtube',
  name: 'YouTube',
  icon: '📹',
  color: '#FF0000',
  apiUrl: 'https://api.outstand.so/v1',
  supportedContentTypes: ['video', 'text'],
  maxContentLength: 5000,
  requiresMediaUpload: true,
  supportsScheduling: true,
  supportsRecurring: false,
  supportsAnalytics: true,
};

export const outstandingYouTubeHandler = new OutstandingPlatformHandler({
  config,
  network: 'youtube',
  selectorsEnvKey: 'OUTSTAND_YOUTUBE_ACCOUNTS',
});
