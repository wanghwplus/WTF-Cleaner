import type { SupportedLanguage } from '../../shared/types.js';

const simplifiedChineseLocales = new Set(['zh', 'zh-cn', 'zh-hans', 'zh-sg']);
const traditionalChineseLocales = new Set(['zh-tw', 'zh-hk', 'zh-mo', 'zh-hant']);

export function normalizeLanguage(locale?: string): SupportedLanguage {
  if (!locale) {
    return 'en';
  }

  const normalized = locale.toLowerCase();

  if (simplifiedChineseLocales.has(normalized)) {
    return 'zh-CN';
  }

  if (traditionalChineseLocales.has(normalized)) {
    return 'zh-Hant';
  }

  return 'en';
}
