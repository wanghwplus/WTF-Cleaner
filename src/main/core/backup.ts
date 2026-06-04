import AdmZip from 'adm-zip';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import type { BackupDeleteResult, DeleteTarget, WowVersionId } from '../../shared/types';

export type BackupAndDeleteInput = {
  backupRoot: string;
  versionId: WowVersionId;
  basePath: string;
  targets: DeleteTarget[];
  createBackup: boolean;
};

export async function backupAndDelete(input: BackupAndDeleteInput): Promise<BackupDeleteResult> {
  const safeTargets = validateTargets(input.basePath, input.targets);
  let backupPath: string | undefined;

  if (input.createBackup && safeTargets.length > 0) {
    backupPath = await createBackupZip(input.backupRoot, input.versionId, safeTargets);
  }

  for (const target of safeTargets) {
    await rm(target.path, { recursive: true, force: false });
  }

  return {
    backupPath,
    deletedPaths: safeTargets.map((target) => target.path)
  };
}

async function createBackupZip(backupRoot: string, versionId: WowVersionId, targets: DeleteTarget[]): Promise<string> {
  const versionBackupRoot = join(backupRoot, 'backups', versionId);
  await mkdir(versionBackupRoot, { recursive: true });

  const zipPath = join(versionBackupRoot, `${formatTimestamp(new Date())}.zip`);
  const zip = new AdmZip();

  for (const target of targets) {
    await addTargetToZip(zip, target);
  }

  zip.writeZip(zipPath);
  return zipPath;
}

async function addTargetToZip(zip: AdmZip, target: DeleteTarget): Promise<void> {
  const targetStat = await stat(target.path);

  if (targetStat.isDirectory()) {
    await addDirectoryToZip(zip, target.path, target.relativePath);
    return;
  }

  zip.addLocalFile(target.path, toPortablePath(relativeDirectory(target.relativePath)));
}

async function addDirectoryToZip(zip: AdmZip, directoryPath: string, relativePath: string): Promise<void> {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  if (entries.length === 0) {
    zip.addFile(`${toPortablePath(relativePath)}/`, Buffer.alloc(0));
    return;
  }

  for (const entry of entries) {
    const childPath = join(directoryPath, entry.name);
    const childRelativePath = join(relativePath, entry.name);

    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, childPath, childRelativePath);
      continue;
    }

    if (entry.isFile()) {
      zip.addLocalFile(childPath, toPortablePath(relativeDirectory(childRelativePath)));
    }
  }
}

function validateTargets(basePath: string, targets: DeleteTarget[]): DeleteTarget[] {
  const resolvedBase = resolve(basePath);

  return targets.map((target) => {
    const resolvedTarget = resolve(target.path);
    const relativeTarget = relative(resolvedBase, resolvedTarget);

    if (relativeTarget.startsWith('..') || relativeTarget === '' || resolve(relativeTarget) === relativeTarget) {
      throw new Error(`Refusing to delete outside version directory: ${target.path}`);
    }

    return {
      ...target,
      relativePath: sanitizeRelativePath(target.relativePath || relativeTarget)
    };
  });
}

function sanitizeRelativePath(path: string): string {
  const normalized = path.replace(/\\/g, '/');

  if (normalized.startsWith('/') || normalized.includes('../') || normalized === '..') {
    throw new Error(`Unsafe relative path: ${path}`);
  }

  return normalized;
}

function relativeDirectory(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');

  if (index === -1) {
    return '';
  }

  return normalized.slice(0, index);
}

function formatTimestamp(date: Date): string {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    '-',
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ];

  return parts.join('');
}

function toPortablePath(path: string): string {
  return path.split(sep).join('/');
}
