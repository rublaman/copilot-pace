import { build, context } from 'esbuild';
import { readdir, mkdir } from 'node:fs/promises';

const production = process.argv.includes('--production');
const options = {
  entryPoints: ['src/extension.ts'], bundle: true, platform: 'node', target: 'es2022', format: 'cjs',
  external: ['vscode'], outfile: 'dist/extension.js', sourcemap: !production, minify: production,
};
await mkdir('dist', { recursive: true });
if (process.argv.includes('--watch')) {
  const watcher = await context(options);
  await watcher.watch();
  console.log('Watching for source changes.');
} else {
  await build(options);
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
    if (testFiles.length) await build({ entryPoints: testFiles, outbase: '.', outdir: 'out', bundle: true, platform: 'node', target: 'es2022', format: 'cjs', external: ['vscode'], sourcemap: true });
  }
}
