import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runVSCodeCommand } from '@vscode/test-electron';

const root = fileURLToPath(new URL('../', import.meta.url));
async function execute(executable, args, env = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: root, stdio: 'inherit', windowsHide: true, env: { ...process.env, ...env } });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Validation exited with code ${code}`)));
  });
}
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check with npm run test:package.');
await execute(process.execPath, [npmCli, 'run', 'build']);
await execute(process.execPath, [npmCli, 'run', 'package']);
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const smokeRoot = path.join(root, '.vscode-test', `packaged-${Date.now()}`);
const extensions = path.join(smokeRoot, 'extensions');
const profile = path.join(smokeRoot, 'profile');
await mkdir(smokeRoot, { recursive: true });
// Seed removed settings on disk to reproduce upgrading from a demo-enabled release.
const settingsPath = path.join(profile, 'User', 'settings.json');
await mkdir(path.dirname(settingsPath), { recursive: true });
await writeFile(settingsPath, JSON.stringify({ 'copilotPace.dataSource': 'mock', 'copilotPace.mockScenario': '3900-justo' }, null, 2));
const install = await runVSCodeCommand([
  '--user-data-dir', profile, '--extensions-dir', extensions,
  '--install-extension', path.join(root, 'dist', `${manifest.name}-${manifest.version}.vsix`),
], { version: '1.141.0' });
console.log(install.stdout);
const installed = (await readdir(extensions)).find(name => name === `${manifest.publisher}.${manifest.name}-${manifest.version}`);
if (!installed) throw new Error('The VSIX was not installed in the test profile.');
const config = path.join(root, '.vscode-test', 'packaged.config.mjs');
await writeFile(config, `import { defineConfig } from '@vscode/test-cli';\nexport default defineConfig(${JSON.stringify({
  label: 'packaged', version: '1.141.0',
  extensionDevelopmentPath: path.join(extensions, installed),
  files: [path.join(root, 'out', 'test', 'package', 'extension.test.js')],
  mocha: { ui: 'bdd', timeout: 15000 },
  launchArgs: ['--disable-extensions', '--skip-welcome', '--skip-release-notes', '--user-data-dir', profile, '--extensions-dir', extensions],
})});\n`);
await execute(process.execPath, [path.join(root, 'node_modules', '@vscode', 'test-cli', 'out', 'bin.mjs'), '--config', config], { COPILOT_PACE_TEST_SETTINGS: settingsPath });
console.log('Production VSIX installed and validated without demos in an isolated profile.');
