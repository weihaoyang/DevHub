# DevHub

DevHub is a Windows desktop installer tool for new-machine setup.

## Features

- Electron + React GUI for selecting software by category.
- `winget`-based serial installation with live progress events.
- Skip already installed packages.
- Continue on failure and retry failed items.
- Proxy configuration (`HTTP_PROXY` / `HTTPS_PROXY`).
- Chinese / English UI switch.
- Preset selection:
  - Developer Standard
  - Essential Utilities (Everything included)
  - System Maintenance
  - Runtime & DLL Repair
  - Content Creator / Music Creator / All-in Creator
  - Short Video Editing / 3D Modeling / Live Streaming / Music Composing
- One-click Runtime/DLL repair: installs common redistributables and runs `sfc /scannow` + `DISM /Online /Cleanup-Image /RestoreHealth`.
- Built-in donation entry (`Buy me a coffee`) configurable in `config/monetization.json`.
- Compliance guardrails:
  - First-launch consent gate before install/repair operations.
  - External link host allowlist policy (configured in `config/compliance.json`).
  - Runtime/DLL repair requires accepted compliance consent.
  - Built-in legal docs under `docs/legal/` (Terms, Privacy, Third-Party, Disclaimer).
- Post-configuration for Git, SSH folder, and PATH checks.
- Log file output at `logs/devhub-YYYYMMDD-HHMMSS.log` (under app user data folder).

Note:
- Some software (for example DaVinci Resolve) may require manual download due repository availability and licensing.

## Compliance Configuration

- `config/compliance.json`
  - `consentVersion`: bump this to force re-consent after policy updates.
  - `externalHostAllowlist`: allowed external domains for in-app URL opening.
  - `legalDocs`: local legal document paths opened from the consent modal.

## Development

```bash
npm install
npm run dev
```

## Build packages

```bash
npm run dist
```

Outputs:

- `DevHub-nsis-x64.exe`
- `DevHub-portable-x64.exe`
