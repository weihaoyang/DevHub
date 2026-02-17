# DevHub

[中文](#中文说明) | [English](#english)

## 中文说明

DevHub 是一个面向 Windows 新机初始化的一键安装工具，支持按分类/预设批量安装软件，并提供运行库修复、合规护栏和日志追踪。

### 主要功能

- Electron + React 图形界面，按分类勾选软件。
- 基于 `winget` 串行安装，实时进度事件。
- 已安装自动跳过；失败不中断；支持失败项重试。
- 支持代理配置（`HTTP_PROXY` / `HTTPS_PROXY`）。
- 中英文界面切换。
- 预设安装包（开发、工具、创作、科研、运行库修复等）。
- 一键运行库/DLL修复（安装常见运行库 + `sfc` + `DISM`）。
- 内置赞助入口（`config/monetization.json`）。
- 合规护栏：
1. 首次必须同意合规条款。
2. 外链仅允许白名单域名。
3. 安装/重试/修复均需后端校验合规同意状态。
4. 内置法律文档（`docs/legal/`）。
- 初始化后配置：Git、SSH 目录、PATH 可见性检查。
- 日志输出到用户目录下 `logs/devhub-YYYYMMDD-HHMMSS.log`。

说明：
- 部分软件可能因上游仓库或授权策略限制，采用手动下载（`manual`）模式，例如 DaVinci Resolve、FreeFileSync。

### 合规配置

- `config/compliance.json`
1. `consentVersion`：协议升级后递增，强制用户重新同意。
2. `externalHostAllowlist`：允许打开的外部域名白名单。
3. `legalDocs`：协议文档路径映射（条款/隐私/第三方/免责声明）。

### 本地开发

```bash
npm install
npm run dev
```

### 打包构建

```bash
npm run dist
```

默认产物（`release/`）：
- `DevHub-Setup-x64.exe`
- `DevHub-Portable-x64.exe`

## English

DevHub is a Windows new-machine bootstrap tool for one-click software setup with categorized selection, presets, runtime repair, compliance guardrails, and installation logs.

### Features

- Electron + React desktop GUI with category-based package selection.
- `winget`-based serial installation with real-time event updates.
- Skip already-installed packages, continue on failure, retry failed items.
- Proxy support (`HTTP_PROXY` / `HTTPS_PROXY`).
- Chinese/English UI switching.
- Preset bundles for development, utilities, creator workflows, research workflows, and runtime repair.
- One-click Runtime/DLL repair (common redistributables + `sfc` + `DISM`).
- Built-in sponsor entry (`config/monetization.json`).
- Compliance guardrails:
1. First-run consent requirement.
2. External link host allowlist enforcement.
3. Backend-side compliance checks for install/retry/repair actions.
4. Built-in legal documents under `docs/legal/`.
- Post-config tasks for Git, SSH folder, and PATH visibility checks.
- Logs written to `logs/devhub-YYYYMMDD-HHMMSS.log` under app user data.

Note:
- Some packages may require manual download due upstream availability or license constraints (for example DaVinci Resolve and FreeFileSync).

### Compliance Configuration

- `config/compliance.json`
1. `consentVersion`: bump to force re-consent after policy changes.
2. `externalHostAllowlist`: whitelist for in-app external URL opening.
3. `legalDocs`: local legal document mapping (terms/privacy/third-party/disclaimer).

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run dist
```

Default artifacts in `release/`:
- `DevHub-Setup-x64.exe`
- `DevHub-Portable-x64.exe`
