import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SupportedLanguage } from '../../shared/types';

export const supportedLanguages: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-Hant', label: '繁體中文' }
];

export const resources = {
  en: {
    translation: {
      app: {
        title: 'WTF Cleaner',
        subtitle: 'Clean World of Warcraft AddOns and saved variables with a backup-first workflow.'
      },
      language: {
        label: 'Language'
      },
      home: {
        selectDirectory: 'Select WoW Directory',
        selectedPath: 'Selected directory',
        emptyTitle: 'Choose your World of Warcraft folder',
        emptyBody: 'Pick the root folder that contains _retail_, _classic_, or _classic_era_.',
        selectFailed: 'Directory selection failed',
        versionsTitle: 'Game Versions',
        missingPaths: 'Missing required paths',
        manageable: 'Ready',
        notManageable: 'Incomplete',
        openVersion: 'Open {{version}}'
      },
      list: {
        back: 'Back',
        rescan: 'Rescan',
        search: 'Search addons or WTF files',
        tabsLabel: 'AddOn groups',
        orphan: 'Orphan WTF',
        blizzard: 'Blizzard Settings',
        selected: '{{count}} selected',
        delete: 'Delete',
        backupDelete: 'Backup & Delete',
        normalTab: 'Installed AddOns',
        pageStatus: 'Page {{current}} / {{total}}',
        previous: 'Previous',
        next: 'Next',
        addon: 'AddOn',
        config: 'Config',
        account: 'Account',
        character: 'Character',
        orphanBadge: 'Orphan WTF',
        blizzardBadge: 'Blizzard',
        noRows: 'No matching entries',
        scanEmpty: 'No AddOns or WTF files found',
        scanFailed: 'Scan failed',
        deleteFailed: 'Delete failed',
        confirmDelete: 'Delete {{count}} selected item?',
        confirmDelete_plural: 'Delete {{count}} selected items?',
        confirmBackupDelete: 'Back up and delete {{count}} selected item?',
        confirmBackupDelete_plural: 'Back up and delete {{count}} selected items?',
        backupCreated: 'Backup created',
        deleted: 'Deleted {{count}} item',
        deleted_plural: 'Deleted {{count}} items'
      },
      stats: {
        addons: 'AddOns',
        configs: 'WTF files',
        orphan: 'Orphans',
        blizzard: 'Blizzard'
      }
    }
  },
  'zh-CN': {
    translation: {
      app: {
        title: 'WTF Cleaner',
        subtitle: '清理魔兽世界插件和 WTF 配置，默认支持先备份再删除。'
      },
      language: {
        label: '语言'
      },
      home: {
        selectDirectory: '选择魔兽世界目录',
        selectedPath: '已选择目录',
        emptyTitle: '选择你的魔兽世界文件夹',
        emptyBody: '请选择包含 _retail_、_classic_ 或 _classic_era_ 的根目录。',
        selectFailed: '目录选择失败',
        versionsTitle: '游戏版本',
        missingPaths: '缺少必要路径',
        manageable: '可管理',
        notManageable: '不完整',
        openVersion: '打开 {{version}}'
      },
      list: {
        back: '返回',
        rescan: '重新扫描',
        search: '搜索插件或 WTF 文件',
        tabsLabel: '插件分组',
        orphan: '孤儿 WTF',
        blizzard: 'Blizzard 设置',
        selected: '已选择 {{count}} 项',
        delete: '删除',
        backupDelete: '备份并删除',
        normalTab: '已安装插件',
        pageStatus: '第 {{current}} / {{total}} 页',
        previous: '上一页',
        next: '下一页',
        addon: '插件',
        config: '配置',
        account: '账号',
        character: '角色',
        orphanBadge: '孤儿 WTF',
        blizzardBadge: 'Blizzard',
        noRows: '没有匹配项',
        scanEmpty: '未找到插件或 WTF 文件',
        scanFailed: '扫描失败',
        deleteFailed: '删除失败',
        confirmDelete: '删除已选择的 {{count}} 项？',
        confirmBackupDelete: '备份并删除已选择的 {{count}} 项？',
        backupCreated: '已创建备份',
        deleted: '已删除 {{count}} 项'
      },
      stats: {
        addons: '插件',
        configs: 'WTF 文件',
        orphan: '孤儿配置',
        blizzard: 'Blizzard'
      }
    }
  },
  'zh-Hant': {
    translation: {
      app: {
        title: 'WTF Cleaner',
        subtitle: '清理魔獸世界插件和 WTF 設定，預設支援先備份再刪除。'
      },
      language: {
        label: '語言'
      },
      home: {
        selectDirectory: '選擇魔獸世界目錄',
        selectedPath: '已選擇目錄',
        emptyTitle: '選擇你的魔獸世界資料夾',
        emptyBody: '請選擇包含 _retail_、_classic_ 或 _classic_era_ 的根目錄。',
        selectFailed: '目錄選擇失敗',
        versionsTitle: '遊戲版本',
        missingPaths: '缺少必要路徑',
        manageable: '可管理',
        notManageable: '不完整',
        openVersion: '開啟 {{version}}'
      },
      list: {
        back: '返回',
        rescan: '重新掃描',
        search: '搜尋插件或 WTF 檔案',
        tabsLabel: '插件分組',
        orphan: '孤兒 WTF',
        blizzard: 'Blizzard 設定',
        selected: '已選擇 {{count}} 項',
        delete: '刪除',
        backupDelete: '備份並刪除',
        normalTab: '已安裝插件',
        pageStatus: '第 {{current}} / {{total}} 頁',
        previous: '上一頁',
        next: '下一頁',
        addon: '插件',
        config: '設定',
        account: '帳號',
        character: '角色',
        orphanBadge: '孤兒 WTF',
        blizzardBadge: 'Blizzard',
        noRows: '沒有符合項目',
        scanEmpty: '未找到插件或 WTF 檔案',
        scanFailed: '掃描失敗',
        deleteFailed: '刪除失敗',
        confirmDelete: '刪除已選擇的 {{count}} 項？',
        confirmBackupDelete: '備份並刪除已選擇的 {{count}} 項？',
        backupCreated: '已建立備份',
        deleted: '已刪除 {{count}} 項'
      },
      stats: {
        addons: '插件',
        configs: 'WTF 檔案',
        orphan: '孤兒設定',
        blizzard: 'Blizzard'
      }
    }
  }
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: supportedLanguages.map((language) => language.code),
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
