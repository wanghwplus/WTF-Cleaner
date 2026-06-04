import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, join, relative, sep } from 'node:path';
import type { AddonEntry, AddonScanRow, VersionScanResult, WowVersion, WowVersionId, WtfEntry } from '../../shared/types';

type VersionDefinition = {
  id: WowVersionId;
  label: string;
};

const versionDefinitions: VersionDefinition[] = [
  { id: '_retail_', label: 'Retail' },
  { id: '_classic_', label: 'Classic' },
  { id: '_classic_era_', label: 'Classic Era / Anniversary' }
];

const versionIds = new Set(versionDefinitions.map((definition) => definition.id));

export async function resolveWowRoot(selectedPath: string): Promise<string> {
  const selectedName = basename(selectedPath);

  if (versionIds.has(selectedName as WowVersionId)) {
    return dirname(selectedPath);
  }

  for (const definition of versionDefinitions) {
    if (await isDirectory(join(selectedPath, definition.id))) {
      return selectedPath;
    }
  }

  const parent = dirname(selectedPath);
  if (versionIds.has(basename(selectedPath) as WowVersionId) || (await containsVersionDirectory(parent))) {
    return parent;
  }

  return selectedPath;
}

export async function discoverWowVersions(selectedPath: string): Promise<WowVersion[]> {
  const root = await resolveWowRoot(selectedPath);
  const versions: WowVersion[] = [];

  for (const definition of versionDefinitions) {
    const versionPath = join(root, definition.id);

    if (!(await isDirectory(versionPath))) {
      continue;
    }

    const addonsPath = join(versionPath, 'Interface', 'AddOns');
    const wtfPath = join(versionPath, 'WTF');
    const missingPaths = [];

    if (!(await isDirectory(addonsPath))) {
      missingPaths.push(toPortablePath(relative(versionPath, addonsPath)));
    }

    if (!(await isDirectory(join(wtfPath, 'Account')))) {
      missingPaths.push(toPortablePath(relative(versionPath, join(wtfPath, 'Account'))));
    }

    versions.push({
      id: definition.id,
      label: definition.label,
      path: versionPath,
      addonsPath,
      wtfPath,
      isManageable: missingPaths.length === 0,
      missingPaths
    });
  }

  return versions;
}

export async function scanWowVersion(version: WowVersion): Promise<VersionScanResult> {
  const addons = await scanAddons(version.addonsPath);
  const addonAliases = buildAddonAliasMap(addons);
  const wtfEntries = await scanWtfEntries(version.path, version.wtfPath, addonAliases);
  const rows = buildRows(addons, wtfEntries);

  return {
    version,
    addons,
    wtfEntries,
    rows,
    orphanCount: wtfEntries.filter((entry) => entry.isOrphan).length,
    scannedAt: new Date().toISOString()
  };
}

async function scanAddons(addonsPath: string): Promise<AddonEntry[]> {
  if (!(await isDirectory(addonsPath))) {
    return [];
  }

  const entries = await readdir(addonsPath, { withFileTypes: true });
  const addons: AddonEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const addonPath = join(addonsPath, entry.name);
    const childEntries = await readdir(addonPath, { withFileTypes: true });
    const tocFiles = childEntries
      .filter((child) => child.isFile() && child.name.toLowerCase().endsWith('.toc'))
      .map((child) => child.name)
      .sort((a, b) => a.localeCompare(b));

    const preferredToc = tocFiles.find((toc) => stripExtension(toc).toLowerCase() === entry.name.toLowerCase()) ?? tocFiles[0];
    const metadata = preferredToc ? await parseToc(join(addonPath, preferredToc)) : {};

    addons.push({
      id: normalizeAddonId(entry.name),
      aliases: [...new Set([entry.name, ...tocFiles.map(stripExtension)].map(normalizeAddonId))],
      folderName: entry.name,
      title: metadata.Title ?? entry.name,
      version: metadata.Version,
      path: addonPath,
      tocFiles
    });
  }

  return addons.sort((a, b) => a.title.localeCompare(b.title));
}

async function parseToc(path: string): Promise<Record<string, string>> {
  const content = await readFile(path, 'utf8');
  const metadata: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const match = /^##\s*([^:]+):\s*(.*)$/.exec(line);
    if (match) {
      metadata[match[1].trim()] = cleanTocValue(match[2]);
    }
  }

  return metadata;
}

async function scanWtfEntries(versionPath: string, wtfPath: string, addonAliases: Map<string, string>): Promise<WtfEntry[]> {
  const accountRoot = join(wtfPath, 'Account');

  if (!(await isDirectory(accountRoot))) {
    return [];
  }

  const accounts = await readdir(accountRoot, { withFileTypes: true });
  const entries: WtfEntry[] = [];

  for (const accountEntry of accounts) {
    if (!accountEntry.isDirectory()) {
      continue;
    }

    const accountPath = join(accountRoot, accountEntry.name);
    entries.push(...(await scanSavedVariablesDirectory(versionPath, join(accountPath, 'SavedVariables'), accountEntry.name)));

    const realmEntries = await readdir(accountPath, { withFileTypes: true });
    for (const realmEntry of realmEntries) {
      if (!realmEntry.isDirectory() || realmEntry.name === 'SavedVariables') {
        continue;
      }

      const realmPath = join(accountPath, realmEntry.name);
      const characterEntries = await readdir(realmPath, { withFileTypes: true });
      for (const characterEntry of characterEntries) {
        if (!characterEntry.isDirectory()) {
          continue;
        }

        entries.push(
          ...(await scanSavedVariablesDirectory(
            versionPath,
            join(realmPath, characterEntry.name, 'SavedVariables'),
            accountEntry.name,
            realmEntry.name,
            characterEntry.name
          ))
        );
      }
    }
  }

  return entries
    .map((entry) => ({
      ...entry,
      addonId: addonAliases.get(entry.addonId) ?? entry.addonId,
      isOrphan: !addonAliases.has(entry.addonId)
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function scanSavedVariablesDirectory(
  versionPath: string,
  savedVariablesPath: string,
  account: string,
  realm?: string,
  character?: string
): Promise<WtfEntry[]> {
  if (!(await isDirectory(savedVariablesPath))) {
    return [];
  }

  const files = await readdir(savedVariablesPath, { withFileTypes: true });
  return files
    .filter((file) => file.isFile() && isSavedVariablesFile(file.name))
    .map((file) => {
      const path = join(savedVariablesPath, file.name);
      const addonId = normalizeAddonId(stripSavedVariablesExtension(file.name));
      const relativePath = toPortablePath(relative(versionPath, path));

      return {
        id: `${relativePath}:${realm ? 'character' : 'account'}`,
        addonId,
        fileName: file.name,
        path,
        relativePath,
        scope: realm ? 'character' : 'account',
        account,
        realm,
        character,
        isOrphan: false
      };
    });
}

function buildRows(addons: AddonEntry[], wtfEntries: WtfEntry[]): AddonScanRow[] {
  const addonsById = new Map(addons.map((addon) => [addon.id, addon]));
  const entriesByAddonId = new Map<string, WtfEntry[]>();

  for (const entry of wtfEntries) {
    const entries = entriesByAddonId.get(entry.addonId) ?? [];
    entries.push(entry);
    entriesByAddonId.set(entry.addonId, entries);
  }

  const ids = new Set([...addonsById.keys(), ...entriesByAddonId.keys()]);

  return [...ids]
    .map((id) => {
      const addon = addonsById.get(id);
      const entries = entriesByAddonId.get(id) ?? [];

      return {
        id,
        addon,
        wtfEntries: entries,
        isOrphan: !addon && entries.length > 0
      };
    })
    .sort((a, b) => rowLabel(a).localeCompare(rowLabel(b)));
}

function buildAddonAliasMap(addons: AddonEntry[]): Map<string, string> {
  const aliases = new Map<string, string>();

  for (const addon of addons) {
    for (const alias of addon.aliases) {
      aliases.set(alias, addon.id);
    }
  }

  return aliases;
}

function rowLabel(row: AddonScanRow): string {
  return row.addon?.title ?? row.id;
}

async function containsVersionDirectory(path: string): Promise<boolean> {
  for (const definition of versionDefinitions) {
    if (await isDirectory(join(path, definition.id))) {
      return true;
    }
  }

  return false;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

function normalizeAddonId(value: string): string {
  return value.toLowerCase();
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function isSavedVariablesFile(fileName: string): boolean {
  const normalized = fileName.toLowerCase();
  return normalized.endsWith('.lua') || normalized.endsWith('.lua.bak');
}

function stripSavedVariablesExtension(fileName: string): string {
  return fileName.replace(/\.lua(?:\.bak)?$/i, '');
}

function cleanTocValue(value: string): string {
  return value
    .replace(/\|c[0-9a-fA-F]{8}/g, '')
    .replace(/\|r/g, '')
    .trim();
}

function toPortablePath(path: string): string {
  return path.split(sep).join('/');
}
