import { build, context } from 'esbuild';
import { cp, readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
if (process.argv.slice(2).some(arg => !['--production', '--watch'].includes(arg))) throw new Error('Unknown build option. Use --production or --watch.');
if (production && watch) throw new Error('Production builds must run the packaging checks; watch is development-only.');
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const development = JSON.parse(await readFile('scripts/development.contributions.json', 'utf8'));
const devCommands = new Set(development.commands.map(item => item.command));
if (manifest.contributes.commands.some(item => devCommands.has(item.command)) ||
    Object.keys(development.configuration.properties).some(key => key in manifest.contributes.configuration.properties)) {
  throw new Error('The production manifest must not contribute demo commands or settings.');
}
const define = { __DEV__: String(!production), __EXTENSION_VERSION__: JSON.stringify(manifest.version) };
// Compile browser code independently, then embed it under the panel's nonce CSP.
const webviewPlugin = {
  name: 'webview-script',
  setup(plugin) {
    plugin.onResolve({ filter: /^copilot-pace:webview$/ }, () => ({ path: 'webview', namespace: 'webview-script' }));
    plugin.onLoad({ filter: /.*/, namespace: 'webview-script' }, async () => {
      const result = await build({
        entryPoints: ['src/webview.ts'], bundle: true, platform: 'browser', target: 'es2022', format: 'iife',
        write: false, metafile: true, minify: production, define,
      });
      return {
        contents: `export default ${JSON.stringify(result.outputFiles[0].text)};`,
        watchFiles: Object.keys(result.metafile.inputs).map(file => resolve(file)),
      };
    });
  },
};
const options = {
  entryPoints: ['src/extension.ts'], bundle: true, platform: 'node', target: 'es2022', format: 'cjs',
  external: ['vscode'], outfile: production ? 'dist/extension.js' : 'out/development/dist/extension.js',
  sourcemap: !production, minify: production, define, plugins: [webviewPlugin],
  metafile: production, write: !production,
};
if (!production) {
  const devManifest = {
    ...manifest,
    contributes: {
      ...manifest.contributes,
      commands: [...manifest.contributes.commands, ...development.commands],
      configuration: {
        ...manifest.contributes.configuration,
        properties: { ...manifest.contributes.configuration.properties, ...development.configuration.properties },
      },
      menus: development.menus,
    },
  };
  // The development host gets its own manifest; package.json always describes the release.
  await mkdir('out/development', { recursive: true });
  await cp('images', 'out/development/images', { recursive: true });
  await writeFile('out/development/package.json', JSON.stringify(devManifest, null, 2) + '\n');
}
if (watch) {
  const watcher = await context(options);
  await watcher.watch();
  console.log('Watching development sources in out/development. Restart watch after manifest changes.');
} else {
  const result = await build(options);
  if (production) {
    for (const output of Object.values(result.metafile.outputs)) {
      for (const [file, input] of Object.entries(output.inputs)) {
        if (/src\/(mocks|development)\.ts$/.test(file) && input.bytesInOutput > 0) {
          throw new Error(`Development code leaked into the production bundle: ${file}`);
        }
      }
    }
    await mkdir('dist', { recursive: true });
    await writeFile('dist/extension.js', result.outputFiles[0].contents);
    console.log('Production bundle verified: no demo adapters or scenarios.');
  }
  if (!production) {
    const testFiles = [];
    async function collect(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = `${directory}/${entry.name}`;
        if (entry.isDirectory()) await collect(file);
        else if (file.endsWith('.test.ts')) testFiles.push(file);
      }
    }
    await collect('test');
    if (testFiles.length) await build({ entryPoints: testFiles, outbase: '.', outdir: 'out', bundle: true, platform: 'node', target: 'es2022', format: 'cjs', external: ['vscode'], sourcemap: true, define, plugins: [webviewPlugin] });
  }
}
