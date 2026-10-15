import { defineConfig } from '@vscode/test-cli';
import path from 'node:path';

export default defineConfig(['1.120.0', '1.141.0'].map(version => ({
  label: version,
  version,
  extensionDevelopmentPath: path.resolve('out/development'),
  files: 'out/test/integration/**/*.test.js',
  mocha: { ui: 'bdd', timeout: 15000 },
  launchArgs: ['--disable-extensions', '--skip-welcome', '--skip-release-notes', '--user-data-dir', path.resolve('.vscode-test', `profile-${version}`)],
})));
