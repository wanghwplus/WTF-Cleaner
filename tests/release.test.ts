import { describe, expect, it } from 'vitest';
import { getNextReleaseVersion, getReleaseArtifactName, shouldKeepReleaseFile } from '../scripts/release-utils';

describe('release utilities', () => {
  it('starts release versioning at 0.0.1 when the current version uses another line', () => {
    expect(getNextReleaseVersion('0.1.0')).toBe('0.0.1');
    expect(getNextReleaseVersion('1.0.0')).toBe('0.0.1');
  });

  it('increments patch versions after 0.0.1', () => {
    expect(getNextReleaseVersion('0.0.1')).toBe('0.0.2');
    expect(getNextReleaseVersion('0.0.9')).toBe('0.0.10');
  });

  it('names artifacts with the app name, platform, architecture, and version', () => {
    expect(getReleaseArtifactName('dmg', '0.0.1', 'x64')).toBe('WTF-Cleaner-v0.0.1-mac-x64.dmg');
    expect(getReleaseArtifactName('nsis', '0.0.1', 'x64')).toBe('WTF-Cleaner-v0.0.1-win-x64.exe');
    expect(getReleaseArtifactName('portable', '0.0.1', 'x64')).toBe('WTF-Cleaner-v0.0.1-win-portable-x64.exe');
  });

  it('keeps only versioned installer and executable artifacts in release output', () => {
    expect(shouldKeepReleaseFile('WTF-Cleaner-v0.0.1-mac-arm64.dmg', '0.0.1')).toBe(true);
    expect(shouldKeepReleaseFile('WTF-Cleaner-v0.0.1-win-x64.exe', '0.0.1')).toBe(true);
    expect(shouldKeepReleaseFile('WTF-Cleaner-v0.0.1-win-x64.exe.blockmap', '0.0.1')).toBe(false);
    expect(shouldKeepReleaseFile('latest.yml', '0.0.1')).toBe(false);
    expect(shouldKeepReleaseFile('win-unpacked', '0.0.1')).toBe(false);
    expect(shouldKeepReleaseFile('WTF-Cleaner-v0.0.2-win-x64.exe', '0.0.1')).toBe(false);
  });
});
