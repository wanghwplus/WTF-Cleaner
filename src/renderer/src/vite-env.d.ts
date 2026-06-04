/// <reference types="vite/client" />

import type { WtfCleanerApi } from '../../preload';

declare global {
  interface Window {
    wtfCleaner: WtfCleanerApi;
  }
}
