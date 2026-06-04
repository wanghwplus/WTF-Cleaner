import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileConfigStore } from '../src/main/core/config';

describe('FileConfigStore', () => {
  it('persists user choices and returns safe defaults', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'wtf-cleaner-config-'));
    const store = new FileConfigStore(userDataPath);

    await expect(store.read()).resolves.toEqual({
      backups: []
    });

    await mkdir(join(userDataPath, 'nested-wow'), { recursive: true });
    await store.update({
      wowRootPath: join(userDataPath, 'nested-wow'),
      language: 'zh-Hant',
      backups: [join(userDataPath, 'backup.zip')]
    });

    await expect(new FileConfigStore(userDataPath).read()).resolves.toEqual({
      wowRootPath: join(userDataPath, 'nested-wow'),
      language: 'zh-Hant',
      backups: [join(userDataPath, 'backup.zip')]
    });
  });
});
