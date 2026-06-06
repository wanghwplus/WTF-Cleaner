import { app, dialog, ipcMain } from 'electron';
import { relative, sep } from 'node:path';
import { backupAndDelete } from './core/backup.js';
import { FileConfigStore } from './core/config.js';
import { normalizeLanguage } from './core/language.js';
import { discoverWowVersions, scanWowVersion } from './core/wow.js';
import type { AppConfig, DeleteTarget, SupportedLanguage, WowVersion } from '../shared/types.js';

export function registerIpcHandlers(): void {
  const configStore = new FileConfigStore(app.getPath('userData'));

  ipcMain.handle('config:get', async (): Promise<AppConfig> => configStore.read());

  ipcMain.handle('language:set', async (_event, language: SupportedLanguage): Promise<AppConfig> => {
    return configStore.update({ language });
  });

  ipcMain.handle('language:detect', (): SupportedLanguage => normalizeLanguage(app.getLocale()));

  ipcMain.handle('wow:select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select World of Warcraft Directory'
    });

    if (result.canceled || !result.filePaths[0]) {
      return undefined;
    }

    const wowRootPath = result.filePaths[0];
    const versions = await discoverWowVersionsWithIcons(wowRootPath);
    await configStore.update({ wowRootPath });

    return {
      wowRootPath,
      versions
    };
  });

  ipcMain.handle('wow:discover-versions', async (_event, selectedPath: string) => {
    const versions = await discoverWowVersionsWithIcons(selectedPath);
    await configStore.update({ wowRootPath: selectedPath });
    return versions;
  });

  ipcMain.handle('wow:scan-version', async (_event, version: WowVersion) => scanWowVersion(version));

  ipcMain.handle(
    'wow:backup-delete',
    async (
      _event,
      payload: {
        version: WowVersion;
        targets: DeleteTarget[];
        createBackup: boolean;
      }
    ) => {
      const result = await backupAndDelete({
        backupRoot: app.getPath('userData'),
        versionId: payload.version.id,
        basePath: payload.version.path,
        targets: payload.targets.map((target) => ({
          ...target,
          relativePath: target.relativePath || toPortablePath(relative(payload.version.path, target.path))
        })),
        createBackup: payload.createBackup
      });

      if (result.backupPath) {
        const config = await configStore.read();
        await configStore.update({
          backups: [result.backupPath, ...config.backups]
        });
      }

      return result;
    }
  );
}

function toPortablePath(path: string): string {
  return path.split(sep).join('/');
}

async function discoverWowVersionsWithIcons(selectedPath: string): Promise<WowVersion[]> {
  return withVersionIcons(await discoverWowVersions(selectedPath));
}

async function withVersionIcons(versions: WowVersion[]): Promise<WowVersion[]> {
  return Promise.all(
    versions.map(async (version) => {
      if (!version.executablePath) {
        return version;
      }

      try {
        const icon = await app.getFileIcon(version.executablePath, { size: 'large' });
        const iconDataUrl = icon.toDataURL();
        return iconDataUrl ? { ...version, iconDataUrl } : version;
      } catch {
        return version;
      }
    })
  );
}
