import AdmZip from 'adm-zip';
import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { backupAndDelete } from '../src/main/core/backup';

describe('backupAndDelete', () => {
  it('backs up selected files and addon directories before deleting them', async () => {
    const root = await mkdtemp(join(tmpdir(), 'wtf-cleaner-delete-'));
    const backupRoot = join(root, 'app-data');
    const addonDir = join(root, '_retail_', 'Interface', 'AddOns', 'OldAddon');
    const wtfFile = join(root, '_retail_', 'WTF', 'Account', 'A', 'SavedVariables', 'OldAddon.lua');

    await mkdir(addonDir, { recursive: true });
    await mkdir(join(root, '_retail_', 'WTF', 'Account', 'A', 'SavedVariables'), { recursive: true });
    await writeFile(join(addonDir, 'OldAddon.toc'), '## Title: Old Addon');
    await writeFile(wtfFile, 'state = {}');

    const result = await backupAndDelete({
      backupRoot,
      versionId: '_retail_',
      basePath: join(root, '_retail_'),
      createBackup: true,
      targets: [
        {
          type: 'addon',
          path: addonDir,
          relativePath: 'Interface/AddOns/OldAddon'
        },
        {
          type: 'wtf',
          path: wtfFile,
          relativePath: 'WTF/Account/A/SavedVariables/OldAddon.lua'
        }
      ]
    });

    expect(result.backupPath).toBeDefined();
    expect(result.deletedPaths).toEqual(expect.arrayContaining([addonDir, wtfFile]));
    await expect(stat(addonDir)).rejects.toThrow();
    await expect(stat(wtfFile)).rejects.toThrow();

    const zip = new AdmZip(result.backupPath);
    const names = zip.getEntries().map((entry) => entry.entryName);
    expect(names).toContain('Interface/AddOns/OldAddon/OldAddon.toc');
    expect(names).toContain('WTF/Account/A/SavedVariables/OldAddon.lua');
  });
});
