import type { PlatformConfig } from '../types';
import { OutstandingPlatformHandler } from './base-handler';

const config: PlatformConfig = {
  id: 'twitter',
  name: 'Twitter / X',
  icon: '𝕏',
  color: '#000000',
  apiUrl: 'https://api.outstand.so/v1',
  supportedContentTypes: ['text', 'image', 'video', 'link'],
  maxContentLength: 280,
  requiresMediaUpload: true,
  supportsScheduling: true,
  supportsRecurring: false,
  supportsAnalytics: true,
};

export const outstandingTwitterHandler = new OutstandingPlatformHandler({
  config,
  network: 'x',
  selectorsEnvKey: 'OUTSTAND_X_ACCOUNTS',
});
