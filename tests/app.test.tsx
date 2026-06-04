import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/renderer/src/App';
import type { WtfCleanerApi } from '../src/preload';

const mockVersion = {
  id: '_retail_' as const,
  label: 'Retail',
  path: '/wow/_retail_',
  addonsPath: '/wow/_retail_/Interface/AddOns',
  wtfPath: '/wow/_retail_/WTF',
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
    expect(await screen.findByRole('button', { name: 'Open Retail' })).toBeInTheDocument();
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
});
