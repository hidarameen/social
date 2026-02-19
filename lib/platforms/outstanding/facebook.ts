import type { PlatformConfig } from '../types';
import { OutstandingPlatformHandler } from './base-handler';

const config: PlatformConfig = {
  id: 'facebook',
  name: 'Facebook',
  icon: '📘',
  color: '#1877F2',
  apiUrl: 'https://api.outstand.so/v1',
  supportedContentTypes: ['text', 'image', 'video', 'link'],
  maxContentLength: 63206,
  requiresMediaUpload: true,
  supportsScheduling: true,
  supportsRecurring: false,
  supportsAnalytics: true,
};

export const outstandingFacebookHandler = new OutstandingPlatformHandler({
  config,
  network: 'facebook',
  selectorsEnvKey: 'OUTSTAND_FACEBOOK_ACCOUNTS',
});
