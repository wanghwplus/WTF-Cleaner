# AGENTS.md

## 基本约束

- 与用户沟通、解释、代码审查结果使用中文。
- 代码、代码注释、UI 文案、README、commit message、PR 标题和描述使用英文。
- 任务必须原子性完成：不分阶段交半成品，不用“是否继续”类话术询问实现步骤。
- 遇到设计级问题（产品目标、业务规则、数据模型边界）先确认；普通技术实现自主决策。
- 不写兼容性代码，除非用户明确要求。
- 不读取 `.env`、私钥、证书、token 等敏感文件，不打印或硬编码密钥。

## 项目技术栈

- Electron + React + TypeScript + Vite。
- 包管理器：pnpm。
- 测试：Vitest + Testing Library。
- 国际化：i18next + react-i18next。
- 打包：electron-vite + electron-builder。

## 常用命令

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm release
```

前端项目约束：

- 不要运行 `pnpm dev`、`pnpm build`、`pnpm preview` 或任何 dev/build/start/serve 类命令，除非用户明确要求或正在执行 release 打包流程。
- 验证优先使用 `pnpm test`、`pnpm typecheck`、`pnpm lint`。

## 质量闸门

- 修改 TypeScript/React/主进程逻辑时，先补行为测试，再实现。
- 核心文件扫描、删除、备份、版本号、release 清理等逻辑必须有单元测试覆盖。
- 提交或汇报完成前至少运行：
  ```bash
  pnpm test
  pnpm typecheck
  pnpm lint
  ```
- 如果验证失败，先修复并重跑，不把失败状态当作完成结果交付。
- 纯文档改动可不跑完整测试，但必须检查 Git diff 和最终工作区状态。

## 架构约定

- Electron 主进程负责文件系统能力：目录选择、WoW 扫描、备份、删除、配置读写。
- Renderer 只负责 UI，不直接访问任意本地文件系统。
- Preload 只暴露受控 API，不暴露 Node.js 原生能力。
- Shared types 放在 `src/shared/`，主进程、preload、renderer 共同使用。
- 用户可见文案必须走 i18n key，不在组件中硬编码多语言文本。

## WoW 扫描规则

- 支持 `_retail_`、`_classic_`、`_classic_era_`。
- 用户误选版本目录时，自动识别父级 WoW 根目录。
- AddOns 扫描目录：`Interface/AddOns/<addonFolder>`。
- WTF 账号级配置：`WTF/Account/<account>/SavedVariables/<addon>.lua`。
- WTF 角色级配置：`WTF/Account/<account>/<realm>/<character>/SavedVariables/<addon>.lua`。
- AddOn 匹配优先使用 `.toc` 文件 basename 作为别名，同时保留目录名作为别名。
- WTF 文件找不到对应 AddOn 时标记为 orphan，并在 UI 中重点提示。

## 删除与备份规则

- 删除目标只能位于对应 WoW 版本目录内部。
- 支持 AddOn 目录和 WTF 配置文件删除。
- 备份后删除必须先成功创建 zip，再删除原文件。
- zip 内保留相对路径，便于恢复。
- 备份默认写入应用数据目录，不写入游戏目录。

## Release 规则

- Release 产物生成命令：
  ```bash
  pnpm release
  ```
- release 版本线固定为 `0.0.x`：
  - 当前版本不在 `0.0.x` 时，首个 release 为 `0.0.1`。
  - 当前版本在 `0.0.x` 时，每次 release patch +1。
- `pnpm release` 会清空旧 `release/`，生成最新版本产物，并只保留当前版本的 `.dmg` 和 `.exe`。
- 产物命名必须包含版本号：
  - `WTF-Cleaner-v<version>-mac-arm64.dmg`
  - `WTF-Cleaner-v<version>-mac-x64.dmg`
  - `WTF-Cleaner-v<version>-win-x64.exe`
  - `WTF-Cleaner-v<version>-win-portable-x64.exe`
- 不要把 `release/` 二进制产物作为普通 Git 文件提交；GitHub 普通 Git 单文件限制为 100 MiB。
- 发布安装包到 GitHub Releases，使用 `gh`：
  ```bash
  gh release create v<version> \
    release/WTF-Cleaner-v<version>-mac-arm64.dmg \
    release/WTF-Cleaner-v<version>-mac-x64.dmg \
    release/WTF-Cleaner-v<version>-win-x64.exe \
    release/WTF-Cleaner-v<version>-win-portable-x64.exe \
    --repo wanghwplus/WTF-Cleaner \
    --target main \
    --title "WTF Cleaner v<version>" \
    --notes "Release v<version>."
  ```
- 如果 release 已存在，使用：
  ```bash
  gh release upload v<version> release/* --repo wanghwplus/WTF-Cleaner --clobber
  ```
- macOS 和 Windows 产物默认未签名；没有签名证书时不要声称已签名。

## Git 规则

- 远程仓库：`git@github.com:wanghwplus/WTF-Cleaner.git`。
- commit message 使用英文一句话摘要。
- 提交前确认：
  ```bash
  git status --short --branch
  ```
- 不要提交 `node_modules/`、`out/`、`release/`、日志、临时文件或密钥文件。
- 不要使用 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。

## 文档同步

- 改 release 流程时，同步更新 `README.md` 和本文件的 Release 规则。
- 改用户可见功能、支持平台、安装方式、验证命令时，同步更新 `README.md`。
- 文档必须与实际命令和产物命名一致。
