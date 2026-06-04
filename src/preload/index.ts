import { contextBridge, ipcRenderer } from 'electron';
import type { AppConfig, BackupDeleteResult, DeleteTarget, SupportedLanguage, VersionScanResult, WowVersion } from '../shared/types';

export type DirectorySelectionResult = {
  wowRootPath: string;
  versions: WowVersion[];
};

export type WtfCleanerApi = {
  getConfig: () => Promise<AppConfig>;
  detectLanguage: () => Promise<SupportedLanguage>;
  setLanguage: (language: SupportedLanguage) => Promise<AppConfig>;
  selectWowDirectory: () => Promise<DirectorySelectionResult | undefined>;
  discoverVersions: (selectedPath: string) => Promise<WowVersion[]>;
  scanVersion: (version: WowVersion) => Promise<VersionScanResult>;
  backupDelete: (payload: { version: WowVersion; targets: DeleteTarget[]; createBackup: boolean }) => Promise<BackupDeleteResult>;
};

const api: WtfCleanerApi = {
  getConfig: () => ipcRenderer.invoke('config:get'),
  detectLanguage: () => ipcRenderer.invoke('language:detect'),
  setLanguage: (language) => ipcRenderer.invoke('language:set', language),
  selectWowDirectory: () => ipcRenderer.invoke('wow:select-directory'),
  discoverVersions: (selectedPath) => ipcRenderer.invoke('wow:discover-versions', selectedPath),
  scanVersion: (version) => ipcRenderer.invoke('wow:scan-version', version),
  backupDelete: (payload) => ipcRenderer.invoke('wow:backup-delete', payload)
};

contextBridge.exposeInMainWorld('wtfCleaner', api);
