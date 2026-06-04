import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { discoverWowVersions, resolveWowRoot, scanWowVersion } from '../src/main/core/wow';

async function createWowFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'wtf-cleaner-wow-'));
  const retail = join(root, '_retail_');

  await mkdir(join(retail, 'Interface', 'AddOns', 'GoodAddon'), { recursive: true });
  await mkdir(join(retail, 'Interface', 'AddOns', 'FolderNamedAddon'), { recursive: true });
  await mkdir(join(retail, 'Interface', 'AddOns', 'ColorAddon'), { recursive: true });
  await mkdir(join(retail, 'WTF', 'Account', 'AccountOne', 'SavedVariables'), { recursive: true });
  await mkdir(join(retail, 'WTF', 'Account', 'AccountOne', 'RealmOne', 'CharacterOne', 'SavedVariables'), {
    recursive: true
  });
  await writeFile(join(retail, 'Interface', 'AddOns', 'GoodAddon', 'GoodAddon.toc'), [
    '## Title: Good Addon',
    '## Version: 1.2.3'
  ].join('\n'));
  await writeFile(join(retail, 'Interface', 'AddOns', 'FolderNamedAddon', 'SavedVariableAlias.toc'), [
    '## Title: Alias Addon',
    '## Version: 4.5.6'
  ].join('\n'));
  await writeFile(
    join(retail, 'Interface', 'AddOns', 'ColorAddon', 'ColorAddon.toc'),
    '## Title: |cff008945Cool|r|cff1e9a4e|r|cff3faa4fdown Ma|r|cff5fb64anag|r|cff7ac243er Ce|r|cff8ccd00ntered|r'
  );
  await writeFile(join(retail, 'Wow.exe'), '');
  await writeFile(join(retail, 'WTF', 'Account', 'AccountOne', 'SavedVariables', 'GoodAddon.lua'), 'state = {}');
  await writeFile(join(retail, 'WTF', 'Account', 'AccountOne', 'SavedVariables', 'SavedVariableAlias.lua'), 'state = {}');
  await writeFile(
    join(retail, 'WTF', 'Account', 'AccountOne', 'RealmOne', 'CharacterOne', 'SavedVariables', 'MissingAddon.lua'),
    'state = {}'
  );

  return root;
}

describe('WoW directory scanning', () => {
  it('resolves a selected version directory back to the WoW root', async () => {
    const root = await createWowFixture();

    await expect(resolveWowRoot(join(root, '_retail_'))).resolves.toBe(root);
  });

  it('discovers manageable game versions from a WoW root', async () => {
    const root = await createWowFixture();

    const versions = await discoverWowVersions(root);

    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({
      id: '_retail_',
      label: 'Retail',
      executablePath: join(root, '_retail_', 'Wow.exe'),
      isManageable: true,
      missingPaths: []
    });
  });

  it('matches WTF entries to installed addons and marks missing addons as orphaned', async () => {
    const root = await createWowFixture();
    const [version] = await discoverWowVersions(root);

    const scan = await scanWowVersion(version);

    expect(scan.addons).toHaveLength(3);
    expect(scan.addons.find((addon) => addon.id === 'goodaddon')).toMatchObject({
      id: 'goodaddon',
      title: 'Good Addon',
      version: '1.2.3'
    });
    expect(scan.addons.find((addon) => addon.id === 'coloraddon')).toMatchObject({
      title: 'Cooldown Manager Centered'
    });
    expect(scan.wtfEntries).toHaveLength(3);
    expect(scan.orphanCount).toBe(1);
    expect(scan.rows.find((row) => row.id === 'foldernamedaddon')).toMatchObject({
      isOrphan: false
    });
    expect(scan.rows.find((row) => row.id === 'missingaddon')).toMatchObject({
      isOrphan: true
    });
  });
});
