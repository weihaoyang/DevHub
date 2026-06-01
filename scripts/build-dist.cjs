const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = process.cwd();
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const outputSubdir = `release-build-${stamp}`;
const outputDir = path.join(rootDir, "release-builds", outputSubdir);
const releaseDir = path.join(rootDir, "release");
const tempConfigPath = path.join(rootDir, "build", "electron-builder-temp.yml");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeTempConfig() {
  const yaml = `appId: com.devhub.installer
productName: DevHub
asar: true
directories:
  output: release-builds/${outputSubdir}
  buildResources: build
files:
  - dist/**/*
  - dist-electron/**/*
  - config/**/*
  - docs/**/*
  - i18n/**/*
  - package.json
extraMetadata:
  main: dist-electron/main.js
win:
  target:
    - target: nsis
      arch:
        - x64
    - target: portable
      arch:
        - x64
nsis:
  artifactName: DevHub-Setup-x64.\${ext}
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
portable:
  artifactName: DevHub-Portable-x64.\${ext}
`;
  fs.writeFileSync(tempConfigPath, yaml, "utf8");
}

function copyArtifactsToRelease() {
  ensureDir(releaseDir);
  const files = [
    "DevHub-Setup-x64.exe",
    "DevHub-Portable-x64.exe",
    "DevHub-Setup-x64.exe.blockmap",
    "latest.yml",
    "builder-debug.yml"
  ];
  for (const fileName of files) {
    const source = path.join(outputDir, fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(releaseDir, fileName));
    }
  }
}

function main() {
  try {
    writeTempConfig();
    ensureDir(outputDir);
    run("npm", ["run", "release:gate"]);
    run("npm", ["run", "build"]);
    run("npx", ["electron-builder", "--config", tempConfigPath]);
    copyArtifactsToRelease();
    console.log(`dist completed via isolated output dir: release-builds/${outputSubdir}`);
  } finally {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }
}

main();
