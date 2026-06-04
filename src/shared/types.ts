export type SupportedLanguage = 'en' | 'zh-CN' | 'zh-Hant';

export type WowVersionId = '_retail_' | '_classic_' | '_classic_era_';

export type WowVersion = {
  id: WowVersionId;
  label: string;
  path: string;
  addonsPath: string;
  wtfPath: string;
  executablePath?: string;
  iconDataUrl?: string;
  isManageable: boolean;
  missingPaths: string[];
};

export type AddonEntry = {
  id: string;
  aliases: string[];
  folderName: string;
  title: string;
  version?: string;
  path: string;
  tocFiles: string[];
};

export type WtfScope = 'account' | 'character';

export type WtfEntry = {
  id: string;
  addonId: string;
  fileName: string;
  path: string;
  relativePath: string;
  scope: WtfScope;
  account: string;
  realm?: string;
  character?: string;
  isOrphan: boolean;
};

export type AddonScanRow = {
  id: string;
  addon?: AddonEntry;
  wtfEntries: WtfEntry[];
  isOrphan: boolean;
};

export type VersionScanResult = {
  version: WowVersion;
  addons: AddonEntry[];
  wtfEntries: WtfEntry[];
  rows: AddonScanRow[];
  orphanCount: number;
  scannedAt: string;
};

export type DeleteTargetType = 'addon' | 'wtf';

export type DeleteTarget = {
  type: DeleteTargetType;
  path: string;
  relativePath: string;
};

export type BackupDeleteResult = {
  backupPath?: string;
  deletedPaths: string[];
};

export type AppConfig = {
  wowRootPath?: string;
  language?: SupportedLanguage;
  backups: string[];
};
