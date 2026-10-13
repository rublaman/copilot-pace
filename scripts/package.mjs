import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { createVSIX } from '@vscode/vsce';

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
await mkdir('dist', { recursive: true });
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
await createVSIX({
  packagePath: `dist/${manifest.name}-${manifest.version}.vsix`,
  githubBranch: sha,
  skipLicense: manifest.license === 'UNLICENSED',
});
