import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPreloadPath } from '../src/main/window';

describe('getPreloadPath', () => {
  it('points to the electron-vite preload output file', () => {
    expect(getPreloadPath(join('app', 'out', 'main'))).toBe(join('app', 'out', 'preload', 'index.mjs'));
  });
});
