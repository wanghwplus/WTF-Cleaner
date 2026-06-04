import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/renderer/src/App';
import type { WtfCleanerApi } from '../src/preload';
import type { AddonScanRow, VersionScanResult } from '../src/shared/types';

const mockVersion = {
  id: '_retail_' as const,
  label: 'Retail',
  path: '/wow/_retail_',
  addonsPath: '/wow/_retail_/Interface/AddOns',
  wtfPath: '/wow/_retail_/WTF',
  executablePath: '/wow/_retail_/Wow.exe',
  iconDataUrl: 'data:image/png;base64,wow-icon',
  isManageable: true,
  missingPaths: []
};

function installMockApi(): WtfCleanerApi {
  const api: WtfCleanerApi = {
    getConfig: vi.fn().mockResolvedValue({ backups: [] }),
    detectLanguage: vi.fn().mockResolvedValue('en'),
    setLanguage: vi.fn().mockResolvedValue({ backups: [], language: 'zh-CN' }),
    selectWowDirectory: vi.fn().mockResolvedValue({
      wowRootPath: '/wow',
      versions: [mockVersion]
    }),
    discoverVersions: vi.fn().mockResolvedValue([mockVersion]),
    scanVersion: vi.fn().mockResolvedValue({
      version: mockVersion,
      addons: [],
      wtfEntries: [],
      rows: [],
      orphanCount: 0,
      scannedAt: new Date().toISOString()
    }),
    backupDelete: vi.fn().mockResolvedValue({ deletedPaths: [] })
  };

  window.wtfCleaner = api;
  return api;
}

function createRows(count: number, isOrphan = false): AddonScanRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = isOrphan ? `orphan-${index + 1}` : `addon-${index + 1}`;
    const title = isOrphan ? `Orphan ${index + 1}` : `Addon ${index + 1}`;

    return {
      id,
      addon: isOrphan
        ? undefined
        : {
            id,
            aliases: [id],
            folderName: title,
            title,
            path: `/wow/_retail_/Interface/AddOns/${title}`,
            tocFiles: [`${title}.toc`]
          },
      wtfEntries: isOrphan
        ? [
            {
              id: `${id}-wtf`,
              addonId: id,
              fileName: `${title}.lua`,
              path: `/wow/_retail_/WTF/Account/A/SavedVariables/${title}.lua`,
              relativePath: `WTF/Account/A/SavedVariables/${title}.lua`,
              scope: 'account',
              account: 'A',
              isOrphan: true
            }
          ]
        : [],
      isOrphan
    };
  });
}

function createScanResult(rows: AddonScanRow[]): VersionScanResult {
  return {
    version: mockVersion,
    addons: rows.flatMap((row) => (row.addon ? [row.addon] : [])),
    wtfEntries: rows.flatMap((row) => row.wtfEntries),
    rows,
    orphanCount: rows.filter((row) => row.isOrphan).length,
    scannedAt: new Date().toISOString()
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installMockApi();
  });

  it('renders the English empty state and discovers versions after choosing a directory', async () => {
    const api = installMockApi();

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'WTF Cleaner' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Select WoW Directory' }));

    await waitFor(() => expect(api.selectWowDirectory).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('img', { name: 'Retail icon' })).toHaveAttribute('src', 'data:image/png;base64,wow-icon');
    expect(await screen.findByRole('button', { name: 'Open Retail' })).toBeInTheDocument();
  });

  it('shows the selected game version icon on the detail page', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Select WoW Directory' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Open Retail' }));

    expect(await screen.findByRole('img', { name: 'Retail icon' })).toHaveAttribute('src', 'data:image/png;base64,wow-icon');
  });

  it('lets users switch to Simplified Chinese', async () => {
    const api = installMockApi();

    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText('Language'), 'zh-CN');

    await waitFor(() => expect(api.setLanguage).toHaveBeenCalledWith('zh-CN'));
    expect(await screen.findByRole('button', { name: '选择魔兽世界目录' })).toBeInTheDocument();
  });

  it('shows an error when directory selection fails', async () => {
    installMockApi().selectWowDirectory = vi.fn().mockRejectedValue(new Error('preload unavailable'));

    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Select WoW Directory' }));

    expect(await screen.findByText('Directory selection failed')).toBeInTheDocument();
  });

  it('separates installed addons and orphan WTF entries into tabs with 20 rows per page', async () => {
    const api = installMockApi();
    api.scanVersion = vi.fn().mockResolvedValue(createScanResult([...createRows(21), ...createRows(1, true)]));

    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Select WoW Directory' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Open Retail' }));

    expect(await screen.findByRole('tab', { name: 'Installed AddOns' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Orphan WTF' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Addon 20')).toBeInTheDocument();
    expect(screen.queryByText('Addon 21')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Orphan WTF' }));

    expect(screen.getByText('Orphan 1')).toBeInTheDocument();
    expect(screen.queryByText('Addon 1')).not.toBeInTheDocument();
  });
});
