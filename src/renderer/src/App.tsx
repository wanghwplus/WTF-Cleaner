import { AlertTriangle, ArrowLeft, CheckCircle2, FolderOpen, RefreshCw, Search, Shield, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { supportedLanguages } from './i18n';
import type { AddonScanRow, DeleteTarget, SupportedLanguage, VersionScanResult, WowVersion } from '../../shared/types';

type FilterMode = 'all' | 'orphan' | 'addons' | 'hasConfig' | 'noConfig';

export default function App(): JSX.Element {
  const { t } = useTranslation();
  const [wowRootPath, setWowRootPath] = useState<string>();
  const [versions, setVersions] = useState<WowVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<WowVersion>();
  const [scanResult, setScanResult] = useState<VersionScanResult>();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterMode>('all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>();
  const [homeStatus, setHomeStatus] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    void initializeApp();
  }, []);

  async function initializeApp(): Promise<void> {
    const [config, detectedLanguage] = await Promise.all([window.wtfCleaner.getConfig(), window.wtfCleaner.detectLanguage()]);
    const language = config.language ?? detectedLanguage;
    await i18n.changeLanguage(language);

    if (config.wowRootPath) {
      setWowRootPath(config.wowRootPath);
      setVersions(await window.wtfCleaner.discoverVersions(config.wowRootPath));
    }
  }

  async function handleLanguageChange(language: SupportedLanguage): Promise<void> {
    await i18n.changeLanguage(language);
    await window.wtfCleaner.setLanguage(language);
  }

  async function handleSelectDirectory(): Promise<void> {
    setIsBusy(true);
    setHomeStatus(undefined);
    try {
      const result = await window.wtfCleaner.selectWowDirectory();
      if (result) {
        setWowRootPath(result.wowRootPath);
        setVersions(result.versions);
        setActiveVersion(undefined);
        setScanResult(undefined);
        setSelectedRows(new Set());
      }
    } catch {
      setHomeStatus(t('home.selectFailed'));
    } finally {
      setIsBusy(false);
    }
  }

  async function openVersion(version: WowVersion): Promise<void> {
    setActiveVersion(version);
    setSelectedRows(new Set());
    await scanVersion(version);
  }

  async function scanVersion(version = activeVersion): Promise<void> {
    if (!version) {
      return;
    }

    setIsBusy(true);
    setStatus(undefined);
    try {
      setScanResult(await window.wtfCleaner.scanVersion(version));
    } catch {
      setStatus(t('list.scanFailed'));
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteSelected(createBackup: boolean): Promise<void> {
    if (!activeVersion || !scanResult || selectedRows.size === 0) {
      return;
    }

    const targets = buildDeleteTargets(activeVersion, scanResult.rows.filter((row) => selectedRows.has(row.id)));
    setIsBusy(true);
    setStatus(undefined);

    try {
      const result = await window.wtfCleaner.backupDelete({
        version: activeVersion,
        targets,
        createBackup
      });
      setStatus(
        result.backupPath
          ? `${t('list.backupCreated')}: ${result.backupPath}`
          : t('list.deleted', { count: result.deletedPaths.length })
      );
      setSelectedRows(new Set());
      await scanVersion(activeVersion);
    } catch {
      setStatus(t('list.deleteFailed'));
    } finally {
      setIsBusy(false);
    }
  }

  const visibleRows = useMemo(() => {
    const rows = scanResult?.rows ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'orphan' && row.isOrphan) ||
        (filter === 'addons' && Boolean(row.addon)) ||
        (filter === 'hasConfig' && row.wtfEntries.length > 0) ||
        (filter === 'noConfig' && row.wtfEntries.length === 0);

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        row.id,
        row.addon?.title,
        row.addon?.folderName,
        ...row.wtfEntries.map((entry) => entry.relativePath)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filter, query, scanResult]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </div>
        <label className="language-select">
          <span>{t('language.label')}</span>
          <select
            aria-label={t('language.label')}
            value={i18n.language}
            onChange={(event) => void handleLanguageChange(event.target.value as SupportedLanguage)}
          >
            {supportedLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {activeVersion ? (
        <VersionDetail
          activeVersion={activeVersion}
          scanResult={scanResult}
          visibleRows={visibleRows}
          selectedRows={selectedRows}
          filter={filter}
          query={query}
          status={status}
          isBusy={isBusy}
          onBack={() => {
            setActiveVersion(undefined);
            setScanResult(undefined);
            setSelectedRows(new Set());
          }}
          onRescan={() => void scanVersion()}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onToggleRow={(rowId) => {
            const next = new Set(selectedRows);
            if (next.has(rowId)) {
              next.delete(rowId);
            } else {
              next.add(rowId);
            }
            setSelectedRows(next);
          }}
          onDelete={(createBackup) => void deleteSelected(createBackup)}
        />
      ) : (
        <HomeView
          wowRootPath={wowRootPath}
          versions={versions}
          status={homeStatus}
          isBusy={isBusy}
          onSelectDirectory={() => void handleSelectDirectory()}
          onOpenVersion={(version) => void openVersion(version)}
        />
      )}
    </main>
  );
}

function HomeView(props: {
  wowRootPath?: string;
  versions: WowVersion[];
  status?: string;
  isBusy: boolean;
  onSelectDirectory: () => void;
  onOpenVersion: (version: WowVersion) => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="home-layout">
      <div className="home-copy">
        <h2>{t('home.emptyTitle')}</h2>
        <p>{t('home.emptyBody')}</p>
        <button className="primary-button" onClick={props.onSelectDirectory} disabled={props.isBusy}>
          <FolderOpen size={18} />
          {t('home.selectDirectory')}
        </button>
        {props.status ? <div className="status-message error">{props.status}</div> : null}
      </div>

      {props.wowRootPath ? (
        <div className="path-strip">
          <span>{t('home.selectedPath')}</span>
          <strong>{props.wowRootPath}</strong>
        </div>
      ) : null}

      {props.versions.length > 0 ? (
        <section className="versions-section">
          <h2>{t('home.versionsTitle')}</h2>
          <div className="version-grid">
            {props.versions.map((version) => (
              <article className="version-card" key={version.id}>
                <div className="version-icon" aria-hidden="true">
                  {version.id === '_retail_' ? 'R' : version.id === '_classic_' ? 'C' : 'A'}
                </div>
                <div>
                  <h3>{version.label}</h3>
                  <p>{version.path}</p>
                </div>
                <StatusPill version={version} />
                {version.missingPaths.length > 0 ? (
                  <p className="missing-paths">
                    {t('home.missingPaths')}: {version.missingPaths.join(', ')}
                  </p>
                ) : null}
                <button onClick={() => props.onOpenVersion(version)} disabled={!version.isManageable}>
                  <FolderOpen size={16} />
                  {t('home.openVersion', { version: version.label })}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function StatusPill({ version }: { version: WowVersion }): JSX.Element {
  const { t } = useTranslation();

  return (
    <span className={version.isManageable ? 'status-pill ready' : 'status-pill warning'}>
      {version.isManageable ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      {version.isManageable ? t('home.manageable') : t('home.notManageable')}
    </span>
  );
}

function VersionDetail(props: {
  activeVersion: WowVersion;
  scanResult?: VersionScanResult;
  visibleRows: AddonScanRow[];
  selectedRows: Set<string>;
  filter: FilterMode;
  query: string;
  status?: string;
  isBusy: boolean;
  onBack: () => void;
  onRescan: () => void;
  onFilterChange: (filter: FilterMode) => void;
  onQueryChange: (query: string) => void;
  onToggleRow: (rowId: string) => void;
  onDelete: (createBackup: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const selectedCount = props.selectedRows.size;

  return (
    <section className="detail-layout">
      <div className="detail-header">
        <button className="icon-button" onClick={props.onBack} title={t('list.back')} aria-label={t('list.back')}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2>{props.activeVersion.label}</h2>
          <p>{props.activeVersion.path}</p>
        </div>
        <button onClick={props.onRescan} disabled={props.isBusy}>
          <RefreshCw size={16} />
          {t('list.rescan')}
        </button>
      </div>

      <div className="stats-grid">
        <Stat label={t('stats.addons')} value={props.scanResult?.addons.length ?? 0} />
        <Stat label={t('stats.configs')} value={props.scanResult?.wtfEntries.length ?? 0} />
        <Stat label={t('stats.orphan')} value={props.scanResult?.orphanCount ?? 0} tone="warning" />
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label={t('list.search')}
            placeholder={t('list.search')}
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
          />
        </label>
        <label className="filter-select">
          <span>{t('list.filter')}</span>
          <select value={props.filter} onChange={(event) => props.onFilterChange(event.target.value as FilterMode)}>
            <option value="all">{t('list.all')}</option>
            <option value="orphan">{t('list.orphan')}</option>
            <option value="addons">{t('list.addons')}</option>
            <option value="hasConfig">{t('list.hasConfig')}</option>
            <option value="noConfig">{t('list.noConfig')}</option>
          </select>
        </label>
      </div>

      <div className="bulk-bar">
        <span>{t('list.selected', { count: selectedCount })}</span>
        <div>
          <button disabled={selectedCount === 0 || props.isBusy} onClick={() => props.onDelete(false)}>
            <Trash2 size={16} />
            {t('list.delete')}
          </button>
          <button className="primary-button" disabled={selectedCount === 0 || props.isBusy} onClick={() => props.onDelete(true)}>
            <Shield size={16} />
            {t('list.backupDelete')}
          </button>
        </div>
      </div>

      {props.status ? <div className="status-message">{props.status}</div> : null}

      <div className="table-shell">
        {props.visibleRows.length > 0 ? (
          props.visibleRows.map((row) => (
            <label className={row.isOrphan ? 'addon-row orphan' : 'addon-row'} key={row.id}>
              <input
                type="checkbox"
                checked={props.selectedRows.has(row.id)}
                onChange={() => props.onToggleRow(row.id)}
              />
              <div className="row-main">
                <div className="row-title">
                  <strong>{row.addon?.title ?? row.id}</strong>
                  {row.isOrphan ? <span>{t('list.orphanBadge')}</span> : null}
                </div>
                <div className="row-meta">
                  <span>
                    {t('list.addon')}: {row.addon?.folderName ?? '-'}
                  </span>
                  <span>
                    {t('list.config')}: {row.wtfEntries.length}
                  </span>
                </div>
                {row.wtfEntries.length > 0 ? (
                  <ul>
                    {row.wtfEntries.slice(0, 4).map((entry) => (
                      <li key={entry.id}>
                        {entry.scope === 'account' ? t('list.account') : t('list.character')}: {entry.relativePath}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </label>
          ))
        ) : (
          <div className="empty-list">{props.scanResult ? t('list.noRows') : t('list.scanEmpty')}</div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warning' }): JSX.Element {
  return (
    <div className={tone === 'warning' ? 'stat warning' : 'stat'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildDeleteTargets(version: WowVersion, rows: AddonScanRow[]): DeleteTarget[] {
  const targets: DeleteTarget[] = [];

  for (const row of rows) {
    if (row.addon) {
      targets.push({
        type: 'addon',
        path: row.addon.path,
        relativePath: relativeToVersion(version.path, row.addon.path)
      });
    }

    for (const entry of row.wtfEntries) {
      targets.push({
        type: 'wtf',
        path: entry.path,
        relativePath: entry.relativePath
      });
    }
  }

  return targets;
}

function relativeToVersion(versionPath: string, path: string): string {
  return path.startsWith(versionPath) ? path.slice(versionPath.length + 1).replace(/\\/g, '/') : path;
}
