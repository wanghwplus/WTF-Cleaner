import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AppConfig } from '../../shared/types';

const configFileName = 'config.json';

export class FileConfigStore {
  private readonly configPath: string;

  constructor(private readonly userDataPath: string) {
    this.configPath = join(userDataPath, configFileName);
  }

  async read(): Promise<AppConfig> {
    try {
      const raw = await readFile(this.configPath, 'utf8');
      return normalizeConfig(JSON.parse(raw) as Partial<AppConfig>);
    } catch (error) {
      if (isFileMissingError(error)) {
        return { backups: [] };
      }

      throw error;
    }
  }

  async update(nextConfig: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.read();
    const merged = normalizeConfig({
      ...current,
      ...nextConfig
    });

    await mkdir(this.userDataPath, { recursive: true });
    await writeFile(this.configPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    return merged;
  }
}

function normalizeConfig(config: Partial<AppConfig>): AppConfig {
  return {
    ...(config.wowRootPath ? { wowRootPath: config.wowRootPath } : {}),
    ...(config.language ? { language: config.language } : {}),
    backups: Array.isArray(config.backups) ? config.backups : []
  };
}

function isFileMissingError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
