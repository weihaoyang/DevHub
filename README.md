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

<!-- SOFTWARE_LIST_START -->
## Included Software List / ??????

Total: **122** packages across categories. / ??? **122** ?????

> Auto-generated from `config/software-catalog.json`. / ??? `config/software-catalog.json` ?????

<details>
<summary><strong>??? / Browser (2)</strong></summary>

- **Google Chrome / Google Chrome**  `google-chrome`  `winget: Google.Chrome`
- **Mozilla Firefox / Mozilla Firefox**  `mozilla-firefox`  `winget: Mozilla.Firefox`

</details>

<details>
<summary><strong>?? / Development (6)</strong></summary>

- **Git / Git**  `git`  `winget: Git.Git`
- **Node.js LTS / Node.js LTS**  `node-lts`  `winget: OpenJS.NodeJS.LTS`
- **Notepad++ / Notepad++**  `notepadpp`  `winget: Notepad++.Notepad++`
- **PowerToys / PowerToys**  `powertoys`  `winget: Microsoft.PowerToys`
- **Python 3.11 / Python 3.11**  `python311`  `winget: Python.Python.3.11`
- **Visual Studio Code / Visual Studio Code**  `vscode`  `winget: Microsoft.VisualStudioCode`

</details>

<details>
<summary><strong>??? / Runtime (18)</strong></summary>

- **DirectX End-User Runtime / DirectX End-User Runtime**  `directx-enduser-runtime`  `winget: Microsoft.DirectX`
- **.NET Desktop Runtime 6 / .NET Desktop Runtime 6**  `dotnet-desktop-6`  `winget: Microsoft.DotNet.DesktopRuntime.6`
- **.NET Desktop Runtime 8 / .NET Desktop Runtime 8**  `dotnet-desktop-8`  `winget: Microsoft.DotNet.DesktopRuntime.8`
- **NVIDIA PhysX / NVIDIA PhysX**  `nvidia-physx`  `winget: Nvidia.PhysX`
- **OpenAL / OpenAL**  `openal`  `winget: CreativeTechnology.OpenAL`
- **VC++ 2005 x64 / VC++ 2005 x64**  `vcredist-2005-x64`  `winget: Microsoft.VCRedist.2005.x64`
- **VC++ 2005 x86 / VC++ 2005 x86**  `vcredist-2005-x86`  `winget: Microsoft.VCRedist.2005.x86`
- **VC++ 2008 x64 / VC++ 2008 x64**  `vcredist-2008-x64`  `winget: Microsoft.VCRedist.2008.x64`
- **VC++ 2008 x86 / VC++ 2008 x86**  `vcredist-2008-x86`  `winget: Microsoft.VCRedist.2008.x86`
- **VC++ 2010 x64 / VC++ 2010 x64**  `vcredist-2010-x64`  `winget: Microsoft.VCRedist.2010.x64`
- **VC++ 2010 x86 / VC++ 2010 x86**  `vcredist-2010-x86`  `winget: Microsoft.VCRedist.2010.x86`
- **VC++ 2012 x64 / VC++ 2012 x64**  `vcredist-2012-x64`  `winget: Microsoft.VCRedist.2012.x64`
- **VC++ 2012 x86 / VC++ 2012 x86**  `vcredist-2012-x86`  `winget: Microsoft.VCRedist.2012.x86`
- **VC++ 2013 x64 / VC++ 2013 x64**  `vcredist-2013-x64`  `winget: Microsoft.VCRedist.2013.x64`
- **VC++ 2013 x86 / VC++ 2013 x86**  `vcredist-2013-x86`  `winget: Microsoft.VCRedist.2013.x86`
- **VC++ 2015+ x64 / VC++ 2015+ x64**  `vcredist-2015plus-x64`  `winget: Microsoft.VCRedist.2015+.x64`
- **VC++ 2015+ x86 / VC++ 2015+ x86**  `vcredist-2015plus-x86`  `winget: Microsoft.VCRedist.2015+.x86`
- **XNA Framework Redistributable / XNA Framework Redistributable**  `xna-framework-redist`  `winget: Microsoft.XNARedist`

</details>

<details>
<summary><strong>?? / Collaboration (3)</strong></summary>

- **钉钉 / DingTalk**  `dingtalk`  `winget: Alibaba.DingTalk`
- **微信 / WeChat**  `wechat`  `winget: Tencent.WeChat`
- **企业微信 / WeCom**  `wecom`  `winget: Tencent.WeCom`

</details>

<details>
<summary><strong>?? / Utility (31)</strong></summary>

- **AutoHotkey / AutoHotkey**  `autohotkey`  `winget: AutoHotkey.AutoHotkey`
- **BleachBit / BleachBit**  `bleachbit`  `winget: BleachBit.BleachBit`
- **Bulk Crap Uninstaller / Bulk Crap Uninstaller**  `bulk-crap-uninstaller`  `winget: Klocman.BulkCrapUninstaller`
- **CrystalDiskInfo / CrystalDiskInfo**  `crystaldiskinfo`  `winget: CrystalDewWorld.CrystalDiskInfo`
- **CrystalDiskMark / CrystalDiskMark**  `crystaldiskmark`  `winget: CrystalDewWorld.CrystalDiskMark`
- **Czkawka ???? / Czkawka**  `czkawka`  `winget: qarmin.czkawka.gui`
- **Ditto 剪贴板 / Ditto Clipboard**  `ditto`  `winget: Ditto.Ditto`
- **Double Commander / Double Commander**  `double-commander`  `winget: alexx2000.DoubleCommander`
- **dupeGuru ?? / dupeGuru**  `dupeguru`  `winget: DupeGuru.DupeGuru`
- **Everything / Everything**  `everything`  `winget: voidtools.Everything`
- **Everything CLI / Everything CLI**  `everything-cli`  `winget: voidtools.Everything.Cli`
- **fd ???? / fd**  `fd-find`  `winget: sharkdp.fd`
- **Flow Launcher / Flow Launcher**  `flow-launcher`  `winget: Flow-Launcher.Flow-Launcher`
- **FreeFileSync / FreeFileSync**  `freefilesync`  `manual: https://freefilesync.org/download.php`
- **Geek Uninstaller / Geek Uninstaller**  `geek-uninstaller`  `winget: GeekUninstaller.GeekUninstaller`
- **grepWin / grepWin**  `grepwin`  `winget: StefansTools.grepWin`
- **KeePassXC ??? / KeePassXC**  `keepassxc`  `winget: KeePassXCTeam.KeePassXC`
- **LocalSend ????? / LocalSend**  `localsend`  `winget: LocalSend.LocalSend`
- **Process Explorer / Process Explorer**  `process-explorer`  `winget: Microsoft.Sysinternals.ProcessExplorer`
- **QuickLook / QuickLook**  `quicklook`  `winget: QL-Win.QuickLook`
- **rclone / rclone**  `rclone`  `winget: Rclone.Rclone`
- **ripgrep / ripgrep**  `ripgrep`  `winget: BurntSushi.ripgrep.GNU`
- **Rufus / Rufus**  `rufus`  `winget: Rufus.Rufus`
- **7-Zip / 7-Zip**  `sevenzip`  `winget: 7zip.7zip`
- **ShareX / ShareX**  `sharex`  `winget: ShareX.ShareX`
- **SumatraPDF / SumatraPDF**  `sumatrapdf`  `winget: SumatraPDF.SumatraPDF`
- **Syncthing ?? / Syncthing**  `syncthing`  `winget: Syncthing.Syncthing`
- **SyncTrayzor / SyncTrayzor**  `synctrayzor`  `winget: SyncTrayzor.SyncTrayzor`
- **Ventoy / Ventoy**  `ventoy`  `winget: Ventoy.Ventoy`
- **WinMerge / WinMerge**  `winmerge`  `winget: WinMerge.WinMerge`
- **WizTree / WizTree**  `wiztree`  `winget: AntibodySoftware.WizTree`

</details>

<details>
<summary><strong>??? / Database (1)</strong></summary>

- **DBeaver Community / DBeaver Community**  `dbeaver-community`  `winget: DBeaver.DBeaver.Community`

</details>

<details>
<summary><strong>???? / Creative (8)</strong></summary>

- **Adobe Creative Cloud / Adobe Creative Cloud**  `adobe-creative-cloud`  `winget: Adobe.CreativeCloud`
- **Blender / Blender**  `blender`  `winget: BlenderFoundation.Blender`
- **DaVinci Resolve / DaVinci Resolve**  `davinci-resolve`  `manual: https://www.blackmagicdesign.com/products/davinciresolve`
- **FFmpeg / FFmpeg**  `ffmpeg`  `winget: Gyan.FFmpeg`
- **GIMP 3 / GIMP 3**  `gimp3`  `winget: GIMP.GIMP.3`
- **HandBrake / HandBrake**  `handbrake`  `winget: HandBrake.HandBrake`
- **Inkscape / Inkscape**  `inkscape`  `winget: Inkscape.Inkscape`
- **OBS Studio / OBS Studio**  `obs-studio`  `winget: OBSProject.OBSStudio`

</details>

<details>
<summary><strong>???? / Music (5)</strong></summary>

- **Audacity / Audacity**  `audacity`  `winget: Audacity.Audacity`
- **Cakewalk by BandLab / Cakewalk by BandLab**  `cakewalk`  `winget: BandLab.Cakewalk`
- **LMMS / LMMS**  `lmms`  `winget: LMMS.LMMS`
- **MuseScore / MuseScore**  `musescore`  `winget: Musescore.Musescore`
- **REAPER / REAPER**  `reaper`  `winget: Cockos.REAPER`

</details>

<details>
<summary><strong>?? / Research (48)</strong></summary>

- **Abaqus / Abaqus**  `abaqus`  `manual: https://www.3ds.com/products/simulia/abaqus`
- **Anaconda / Anaconda**  `anaconda`  `winget: Anaconda.Anaconda3`
- **Ansys / Ansys**  `ansys`  `manual: https://www.ansys.com/academic/students/ansys-student`
- **ArcGIS Pro / ArcGIS Pro**  `arcgis-pro`  `manual: https://www.esri.com/en-us/arcgis/products/arcgis-pro/trial`
- **ATLAS.ti / ATLAS.ti**  `atlas-ti`  `manual: https://atlasti.com/free-trial-version`
- **ChemOffice / ChemDraw / ChemOffice / ChemDraw**  `chemoffice`  `manual: https://revvitysignals.com/products/research/chemdraw`
- **COMSOL Multiphysics / COMSOL Multiphysics**  `comsol`  `manual: https://www.comsol.com/download`
- **Cytoscape / Cytoscape**  `cytoscape`  `manual: https://cytoscape.org/download.html`
- **EndNote / EndNote**  `endnote`  `manual: https://endnote.com/downloads/`
- **EViews / EViews**  `eviews`  `manual: https://www.eviews.com/download/`
- **Fiji / ImageJ / Fiji / ImageJ**  `fiji-imagej`  `manual: https://imagej.net/software/fiji/downloads`
- **Gaussian / Gaussian**  `gaussian`  `manual: https://gaussian.com/`
- **网络分析 (Gephi) / Gephi**  `gephi`  `manual: https://gephi.org/users/download/`
- **Gnuplot / Gnuplot**  `gnuplot`  `manual: http://www.gnuplot.info/download.html`
- **GraphPad Prism / GraphPad Prism**  `graphpad-prism`  `manual: https://www.graphpad.com/downloads/`
- **Graphviz / Graphviz**  `graphviz`  `winget: Graphviz.Graphviz`
- **参考文献 (JabRef) / JabRef**  `jabref`  `winget: JabRef.JabRef`
- **jamovi / jamovi**  `jamovi`  `manual: https://www.jamovi.org/download.html`
- **JASP / JASP**  `jasp`  `manual: https://jasp-stats.org/download/`
- **Julia / Julia**  `julia`  `winget: Julialang.Julia`
- **KiCad / KiCad**  `kicad`  `winget: KiCad.KiCad`
- **LabVIEW / LabVIEW**  `labview`  `manual: https://www.ni.com/en/support/downloads/software-products/download.labview.html`
- **LTspice / LTspice**  `ltspice`  `winget: AnalogDevices.LTspice`
- **Wolfram Mathematica / Wolfram Mathematica**  `mathematica`  `manual: https://www.wolfram.com/mathematica/`
- **MATLAB / MATLAB**  `matlab`  `manual: https://www.mathworks.com/downloads/`
- **MAXQDA / MAXQDA**  `maxqda`  `manual: https://www.maxqda.com/download`
- **MiKTeX / MiKTeX**  `miktex`  `winget: MiKTeX.MiKTeX`
- **Mplus / Mplus**  `mplus`  `manual: https://www.statmodel.com/download/usersguide/MplusUserGuideVer_8.pdf`
- **NVivo / NVivo**  `nvivo`  `manual: https://lumivero.com/products/nvivo/`
- **GNU Octave / GNU Octave**  `octave`  `winget: GNU.Octave`
- **OpenFOAM / OpenFOAM**  `openfoam`  `manual: https://www.openfoam.com/download/windows`
- **OriginPro / OriginPro**  `originpro`  `manual: https://www.originlab.com/demodownload.aspx`
- **Pandoc / Pandoc**  `pandoc`  `winget: JohnMacFarlane.Pandoc`
- **ParaView / ParaView**  `paraview`  `winget: Kitware.ParaView`
- **PyMOL / PyMOL**  `pymol-open-source`  `manual: https://pymol.org/2/`
- **QGIS / QGIS**  `qgis`  `winget: QGIS.QGIS`
- **Quarto / Quarto**  `quarto`  `winget: Quarto.Quarto`
- **R 语言 / R Project**  `r-project`  `winget: RProject.R`
- **RStudio / RStudio**  `rstudio`  `winget: Posit.RStudio`
- **SAS / SAS**  `sas`  `manual: https://www.sas.com/en_us/software/on-demand-for-academics.html`
- **Scilab / Scilab**  `scilab`  `manual: https://www.scilab.org/download/scilab-2026.0.0`
- **SmartPLS / SmartPLS**  `smartpls`  `manual: https://www.smartpls.com/downloads`
- **IBM SPSS Statistics / IBM SPSS Statistics**  `spss`  `manual: https://www.ibm.com/products/spss-statistics`
- **Stata / Stata**  `stata`  `manual: https://www.stata.com/install-guide/`
- **Stellarium / Stellarium**  `stellarium`  `winget: Stellarium.Stellarium`
- **TeXstudio / TeXstudio**  `texstudio`  `winget: TeXstudio.TeXstudio`
- **VMD / VMD**  `vmd`  `manual: https://www.ks.uiuc.edu/Development/Download/download.cgi?PackageName=VMD`
- **文献管理 (Zotero) / Zotero**  `zotero`  `winget: Zotero.Zotero`

</details>

<!-- SOFTWARE_LIST_END -->
