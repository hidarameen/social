import type { PlatformConfig } from '../types';
import { OutstandingPlatformHandler } from './base-handler';

const config: PlatformConfig = {
  id: 'instagram',
  name: 'Instagram',
  icon: '📷',
  color: '#E4405F',
  apiUrl: 'https://api.outstand.so/v1',
  supportedContentTypes: ['image', 'video', 'text'],
  maxContentLength: 2200,
  requiresMediaUpload: true,
  supportsScheduling: true,
  supportsRecurring: false,
  supportsAnalytics: true,
};

export const outstandingInstagramHandler = new OutstandingPlatformHandler({
  config,
  network: 'instagram',
  selectorsEnvKey: 'OUTSTAND_INSTAGRAM_ACCOUNTS',
});
