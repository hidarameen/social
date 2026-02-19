import type { PlatformConfig } from '../types';
import { OutstandingPlatformHandler } from './base-handler';

const config: PlatformConfig = {
  id: 'linkedin',
  name: 'LinkedIn',
  icon: '💼',
  color: '#0A66C2',
  apiUrl: 'https://api.outstand.so/v1',
  supportedContentTypes: ['text', 'image', 'video', 'link'],
  maxContentLength: 3000,
  requiresMediaUpload: true,
  supportsScheduling: true,
  supportsRecurring: false,
  supportsAnalytics: true,
};

export const outstandingLinkedInHandler = new OutstandingPlatformHandler({
  config,
  network: 'linkedin',
  selectorsEnvKey: 'OUTSTAND_LINKEDIN_ACCOUNTS',
});
