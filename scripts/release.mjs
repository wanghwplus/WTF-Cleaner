import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const releaseDir = resolve(projectRoot, 'release');
const packageJsonPath = resolve(projectRoot, 'package.json');

function getNextReleaseVersion(currentVersion) {
  const match = /^0\.0\.(\d+)$/.exec(currentVersion);

  if (!match) {
    return '0.0.1';
  }

  return `0.0.${Number(match[1]) + 1}`;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function readPackageJson() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function writePackageJson(packageJson) {
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function shouldKeepReleaseFile(fileName, version) {
  const versionLabel = `v${version}`;
  const isCurrentVersion = fileName.includes(versionLabel);
  const isArtifact = fileName.endsWith('.dmg') || fileName.endsWith('.exe');

  return isCurrentVersion && isArtifact;
}

function pruneReleaseDirectory(version) {
  for (const entry of readdirSync(releaseDir, { withFileTypes: true })) {
    if (shouldKeepReleaseFile(entry.name, version)) {
      continue;
    }

    rmSync(resolve(releaseDir, entry.name), { recursive: true, force: true });
  }
}

function preparePackageJson(nextVersion) {
  const packageJson = readPackageJson();
  packageJson.version = nextVersion;
  packageJson.build = {
    ...packageJson.build,
    artifactName: 'WTF-Cleaner-v${version}-${os}-${arch}.${ext}',
    mac: {
      ...packageJson.build.mac,
      target: ['dmg']
    },
    win: {
      ...packageJson.build.win,
      target: ['nsis', 'portable']
    },
    nsis: {
      ...packageJson.build.nsis,
      artifactName: 'WTF-Cleaner-v${version}-win-${arch}.${ext}'
    },
    portable: {
      ...packageJson.build.portable,
      artifactName: 'WTF-Cleaner-v${version}-win-portable-${arch}.${ext}'
    }
  };
  writePackageJson(packageJson);
}

async function main() {
  const packageJson = readPackageJson();
  const nextVersion = getNextReleaseVersion(packageJson.version);

  if (existsSync(releaseDir)) {
    rmSync(releaseDir, { recursive: true, force: true });
  }
  await mkdir(releaseDir, { recursive: true });

  preparePackageJson(nextVersion);

  try {
    run('pnpm', ['exec', 'electron-vite', 'build']);
    run('pnpm', [
      'exec',
      'electron-builder',
      '--mac',
      '--x64',
      '--arm64',
      '--publish',
      'never',
      '--config.directories.output=release'
    ]);
    run('pnpm', ['exec', 'electron-builder', '--win', '--x64', '--publish', 'never', '--config.directories.output=release']);
    pruneReleaseDirectory(nextVersion);
  } catch (error) {
    writePackageJson(packageJson);
    throw error;
  }

  console.log(`Release v${nextVersion} generated in ${releaseDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
