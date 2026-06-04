import { describe, expect, it } from 'vitest';
import { normalizeLanguage } from '../src/main/core/language';

describe('normalizeLanguage', () => {
  it('maps simplified Chinese locales to zh-CN', () => {
    expect(normalizeLanguage('zh')).toBe('zh-CN');
    expect(normalizeLanguage('zh-Hans')).toBe('zh-CN');
    expect(normalizeLanguage('zh-SG')).toBe('zh-CN');
  });

  it('maps traditional Chinese locales to zh-Hant', () => {
    expect(normalizeLanguage('zh-TW')).toBe('zh-Hant');
    expect(normalizeLanguage('zh-HK')).toBe('zh-Hant');
    expect(normalizeLanguage('zh-MO')).toBe('zh-Hant');
  });

  it('falls back to English for unsupported locales', () => {
    expect(normalizeLanguage('fr-FR')).toBe('en');
    expect(normalizeLanguage(undefined)).toBe('en');
  });
});
