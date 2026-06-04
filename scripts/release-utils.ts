export type ReleaseTarget = 'dmg' | 'nsis' | 'portable';

export function getNextReleaseVersion(currentVersion: string): string {
  const match = /^0\.0\.(\d+)$/.exec(currentVersion);

  if (!match) {
    return '0.0.1';
  }

  return `0.0.${Number(match[1]) + 1}`;
}

export function getReleaseArtifactName(target: ReleaseTarget, version: string, arch: string): string {
  const versionLabel = `v${version}`;

  if (target === 'dmg') {
    return `WTF-Cleaner-${versionLabel}-mac-${arch}.dmg`;
  }

  if (target === 'portable') {
    return `WTF-Cleaner-${versionLabel}-win-portable-${arch}.exe`;
  }

  return `WTF-Cleaner-${versionLabel}-win-${arch}.exe`;
}

export function shouldKeepReleaseFile(fileName: string, version: string): boolean {
  const versionLabel = `v${version}`;
  const isCurrentVersion = fileName.includes(versionLabel);
  const isArtifact = fileName.endsWith('.dmg') || fileName.endsWith('.exe');

  return isCurrentVersion && isArtifact;
}
