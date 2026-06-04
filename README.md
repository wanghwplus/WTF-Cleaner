# WTF Cleaner

WTF Cleaner is a cross-platform desktop app for cleaning World of Warcraft AddOns and saved variable files.

It helps you select a local World of Warcraft installation, detect installed game versions, scan AddOns and WTF configuration files, identify orphaned saved variables, and delete selected files with an optional zip backup.

## Features

- Supports macOS and Windows through Electron.
- Detects `_retail_`, `_classic_`, and `_classic_era_` game folders.
- Scans AddOns from `Interface/AddOns`.
- Scans account-level WTF files from `WTF/Account/<account>/SavedVariables`.
- Scans character-level WTF files from `WTF/Account/<account>/<realm>/<character>/SavedVariables`.
- Highlights orphan WTF files when no matching AddOn exists.
- Supports single selection, multi-selection, delete, and backup before delete.
- Stores backups under the app data directory.
- Supports English, Simplified Chinese, and Traditional Chinese.

## Release Files

Prebuilt v0.0.1 artifacts are stored in `release/`:

- `WTF-Cleaner-v0.0.1-mac-arm64.dmg`
- `WTF-Cleaner-v0.0.1-mac-x64.dmg`
- `WTF-Cleaner-v0.0.1-win-x64.exe`
- `WTF-Cleaner-v0.0.1-win-portable-x64.exe`

The release files are unsigned. macOS Gatekeeper and Windows SmartScreen may show warnings until proper signing certificates are configured.

## Development

Install dependencies:

```bash
pnpm install
```

Run verification:

```bash
pnpm test
pnpm typecheck
pnpm lint
```

Generate a new release:

```bash
pnpm release
```

The release script:

- Increments versions on the `0.0.x` line.
- Starts at `0.0.1` if the current version is not already on that line.
- Clears the old `release/` directory.
- Generates macOS DMG and Windows EXE artifacts.
- Keeps only the latest `.dmg` and `.exe` files in `release/`.

## Git Remote

Repository remote:

```text
git@github.com:wanghwplus/WTF-Cleaner.git
```
