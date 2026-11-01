import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { releaseMetadata } from '../../scripts/release.mjs';
import { selectCiRun } from '../../scripts/select-ci-run.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixtures = path.join(root, '.vscode-test', 'release-fixtures');
const manifestFor = (version = '0.2.0', preview = true) => ({
  name: 'copilot-pace', displayName: 'Copilot Pace', publisher: 'rubenblancomanzano', version, preview,
  description: 'Release validation fixture.', license: 'MIT', private: true,
  engines: { vscode: '^1.120.0' }, repository: { type: 'git', url: 'https://github.com/rublaman/copilot-pace.git' },
  main: './dist/extension.js', icon: 'images/copilot-pace-128.png', activationEvents: ['onStartupFinished'],
});
const lockFor = version => ({ version, packages: { '': { version } } });
const changelogFor = version => `# Changelog\n\n## [${version}] - 2026-10-13\n\n- Release validation fixture.\n`;
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

test('numeric pilot and stable releases choose their intended source branch', () => {
  for (const [version, preview, branch] of [['0.2.0', true, 'develop'], ['1.0.0', false, 'main'], ['1.1.0', true, 'develop']]) {
    assert.deepEqual(releaseMetadata(manifestFor(version, preview), lockFor(version), `v${version}`, changelogFor(version), true),
      { version, branch, prerelease: preview, changes: '- Release validation fixture.' });
  }
});

test('release metadata rejects malformed tags and mismatched lockfile versions', () => {
  for (const tag of ['0.2.0', 'v0.2.0-beta.1', 'v00.2.0', 'v0.2.0+test', 'v0.2']) {
    assert.throws(() => releaseMetadata(manifestFor(), lockFor('0.2.0'), tag, changelogFor('0.2.0'), true), /numeric tag/);
  }
  for (const lock of [{ version: '0.1.3', packages: { '': { version: '0.2.0' } } },
    { version: '0.2.0', packages: { '': { version: '0.1.3' } } }]) {
    assert.throws(() => releaseMetadata(manifestFor(), lock, 'v0.2.0', changelogFor('0.2.0'), true), /versions must agree/);
  }
});

test('release metadata blocks missing channels, pre-1.0 stable, unresolved licenses and incomplete notes', () => {
  const valid = manifestFor();
  const metadata = (manifest = valid, notes = changelogFor('0.2.0'), license = true) =>
    releaseMetadata(manifest, lockFor('0.2.0'), 'v0.2.0', notes, license);
  assert.throws(() => metadata({ ...valid, preview: undefined }), /Set preview/);
  assert.throws(() => metadata({ ...valid, preview: false }), /start at 1.0.0/);
  assert.throws(() => metadata({ ...valid, license: 'UNLICENSED' }), /distribution terms/);
  assert.throws(() => metadata(valid, changelogFor('0.2.0'), false), /distribution terms/);
  assert.throws(() => metadata(valid, changelogFor('0.1.3')), /dated changelog/);
  assert.throws(() => metadata(valid, '## [0.2.0] - 2026-10-13\n\nTODO\n'), /Complete the changelog/);
  assert.throws(() => metadata(valid, '## [0.2.0] - 2026-10-13\n\n## [0.1.3] - 2026-10-12\n- Older changes.'), /Complete the changelog/);
});

test('only a successful push run for the exact candidate and channel is selected', () => {
  const sha = 'a'.repeat(40);
  const valid = { databaseId: 123, headSha: sha, headBranch: 'main', event: 'push', status: 'completed', conclusion: 'success' };
  const rejected = [
    { ...valid, headSha: 'b'.repeat(40) },
    { ...valid, headBranch: 'develop' },
    { ...valid, event: 'pull_request' },
    { ...valid, status: 'in_progress' },
    { ...valid, conclusion: 'failure' },
    { ...valid, databaseId: 0 },
    { ...valid, databaseId: '123' },
  ];
  for (const run of rejected) assert.throws(() => selectCiRun([run], sha, 'main'), /No successful/);
  assert.equal(selectCiRun([...rejected, valid], sha, 'main'), 123);
  assert.throws(() => selectCiRun([valid], 'short', 'main'), /Invalid candidate/);
  assert.throws(() => selectCiRun([valid], sha, 'feature/other'), /Invalid candidate/);
  assert.throws(() => selectCiRun([], sha, 'develop'), /No successful/);
  assert.equal(selectCiRun([{ ...valid, headBranch: 'develop' }], sha, 'develop'), 123);
});
async function fixture(t) {
  await mkdir(fixtures, { recursive: true });
  const directory = await mkdtemp(path.join(fixtures, 'candidate-'));
  t.after(async () => {
    assert.ok(path.resolve(directory).startsWith(path.resolve(fixtures) + path.sep));
    await rm(directory, { recursive: true, force: true });
  });
  const manifest = manifestFor();
  await writeFile(path.join(directory, 'package.json'), JSON.stringify(manifest));
  await writeFile(path.join(directory, 'package-lock.json'), JSON.stringify(lockFor(manifest.version)));
  await writeFile(path.join(directory, 'CHANGELOG.md'), changelogFor(manifest.version));
  await writeFile(path.join(directory, 'README.md'), '# Release fixture\n');
  await writeFile(path.join(directory, 'LICENSE'), 'License fixture for automated tests only.\n');
  await writeFile(path.join(directory, '.gitignore'), '/dist/\n/dist-release-notes.md\n');
  git(directory, 'init', '--initial-branch=develop');
  git(directory, 'add', '--', '.');
  git(directory, '-c', 'user.name=Release Test', '-c', 'user.email=release-test@example.invalid', 'commit', '-m', 'Release fixture');
  git(directory, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
  return directory;
}

function runRelease(cwd) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'release.mjs'), 'v0.2.0'],
    { cwd, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: '' } });
}

function annotate(cwd) {
  git(cwd, '-c', 'user.name=Release Test', '-c', 'user.email=release-test@example.invalid', 'tag', '-a', 'v0.2.0', '-m', 'Pilot fixture');
}

test('annotated tag validation creates notes for the exact candidate commit', async t => {
  const cwd = await fixture(t);
  annotate(cwd);
  const result = runRelease(cwd);
  assert.equal(result.status, 0, result.stderr);
  const notes = await readFile(path.join(cwd, 'dist-release-notes.md'), 'utf8');
  assert.ok(notes.includes(git(cwd, 'rev-parse', 'HEAD')));
  assert.ok(notes.includes('Pilot: real account'));
});

test('lightweight tags cannot release', async t => {
  const cwd = await fixture(t);
  git(cwd, 'tag', 'v0.2.0');
  const result = runRelease(cwd);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be annotated/);
});

test('a tag outside the intended remote branch cannot release', async t => {
  const cwd = await fixture(t);
  git(cwd, '-c', 'user.name=Release Test', '-c', 'user.email=release-test@example.invalid', 'commit', '--allow-empty', '-m', 'Unmerged candidate');
  annotate(cwd);
  assert.notEqual(runRelease(cwd).status, 0);
});

test('dirty release checkouts cannot release', async t => {
  const cwd = await fixture(t);
  annotate(cwd);
  await writeFile(path.join(cwd, 'README.md'), '# Modified after tagging\n');
  const result = runRelease(cwd);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /clean checkout/);
});

test('packaging a changed version ignores stale VSIX files and rejects extra packaged content', async t => {
  const cwd = await fixture(t);
  await mkdir(path.join(cwd, 'dist'), { recursive: true });
  await writeFile(path.join(cwd, 'dist', 'extension.js'), 'module.exports = {};\n');
  await writeFile(path.join(cwd, 'dist', 'copilot-pace-0.1.3.vsix'), 'stale artifact');
  await writeFile(path.join(cwd, 'dist', 'build-info.json'), '{"version":"0.1.3"}');
  await writeFile(path.join(cwd, 'dist', 'SHA256SUMS.txt'), 'stale checksum');
  await cp(path.join(root, 'images'), path.join(cwd, 'images'), { recursive: true });
  await cp(path.join(root, '.vscodeignore'), path.join(cwd, '.vscodeignore'));
  const packaged = spawnSync(process.execPath, [path.join(root, 'scripts', 'package.mjs')], { cwd, encoding: 'utf8' });
  assert.equal(packaged.status, 0, packaged.stderr);
  const inspector = path.join(root, 'scripts', 'inspect-vsix.ps1');
  const inspect = () => spawnSync('pwsh', ['-NoProfile', '-File', inspector, '-Root', cwd], { cwd, encoding: 'utf8' });
  const result = inspect();
  assert.equal(result.status, 0, result.stderr);
  const manifestPath = path.join(cwd, 'package.json');
  const stableManifest = { ...manifestFor(), preview: false };
  await writeFile(manifestPath, JSON.stringify(stableManifest));
  const wrongChannel = inspect();
  assert.notEqual(wrongChannel.status, 0);
  assert.match(wrongChannel.stderr, /Packaged manifest differs: preview/);
  await writeFile(manifestPath, JSON.stringify(manifestFor()));
  const vsix = path.join(cwd, 'dist', 'copilot-pace-0.2.0.vsix');
  // Exercise the exact draft checks without reaching the release-creation commands.
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'release.yml'), 'utf8');
  const start = workflow.indexOf("          $ErrorActionPreference = 'Stop'", workflow.indexOf('name: Verify the tested artifact'));
  const end = workflow.indexOf('          $existing = gh api', start);
  assert.ok(start >= 0 && end > start, 'Draft verification steps are present');
  const verify = workflow.slice(start, end).replace(/^ {10}/gm, '');
  const candidate = path.join(cwd, 'candidate');
  await mkdir(candidate);
  const candidateVsix = path.join(candidate, 'copilot-pace-0.2.0.vsix');
  await cp(vsix, candidateVsix);
  const sha = 'a'.repeat(40);
  const runUrl = 'https://github.com/example/repo/actions/runs/123';
  const validateCandidate = async (expectedPreview, metadataPreview) => {
    const hash = createHash('sha256').update(await readFile(candidateVsix)).digest('hex');
    await writeFile(path.join(candidate, 'SHA256SUMS.txt'), `${hash}  copilot-pace-0.2.0.vsix`);
    await writeFile(path.join(candidate, 'build-info.json'), JSON.stringify({
      runUrl, sha, dirty: false, version: '0.2.0', preview: metadataPreview,
      name: 'copilot-pace', publisher: 'rubenblancomanzano', file: 'copilot-pace-0.2.0.vsix', sha256: hash,
    }));
    return spawnSync('pwsh', ['-NoProfile', '-Command', verify], {
      cwd, encoding: 'utf8', env: { ...process.env, GITHUB_SERVER_URL: 'https://github.com', GH_REPO: 'example/repo',
        CI_RUN_ID: '123', RELEASE_SHA: sha, RELEASE_VERSION: '0.2.0', RELEASE_PRERELEASE: String(expectedPreview) },
    });
  };
  assert.equal((await validateCandidate(true, true)).status, 0);
  const pilotAsStable = await validateCandidate(false, false);
  assert.notEqual(pilotAsStable.status, 0);
  assert.match(pilotAsStable.stderr, /Packaged manifest differs/);
  const wrongMetadata = await validateCandidate(false, true);
  assert.notEqual(wrongMetadata.status, 0);
  assert.match(wrongMetadata.stderr, /Artifact provenance differs/);
  const changePreview = spawnSync('pwsh', ['-NoProfile', '-Command',
    '$zip = [System.IO.Compression.ZipFile]::Open($env:TEST_VSIX, [System.IO.Compression.ZipArchiveMode]::Update); try { $entry = $zip.GetEntry("extension/package.json"); $reader = [System.IO.StreamReader]::new($entry.Open()); try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }; $entry.Delete(); $manifest.preview = $false; $new = $zip.CreateEntry("extension/package.json"); $writer = [System.IO.StreamWriter]::new($new.Open()); try { $writer.Write(($manifest | ConvertTo-Json -Depth 30)) } finally { $writer.Dispose() } } finally { $zip.Dispose() }'],
  { cwd, encoding: 'utf8', env: { ...process.env, TEST_VSIX: candidateVsix } });
  assert.equal(changePreview.status, 0, changePreview.stderr);
  assert.equal((await validateCandidate(false, false)).status, 0);
  const stableAsPilot = await validateCandidate(true, true);
  assert.notEqual(stableAsPilot.status, 0);
  assert.match(stableAsPilot.stderr, /Packaged manifest differs/);
  // Inject a file into the ZIP to check the package boundary, independent of ignore rules.
  const mutate = spawnSync('pwsh', ['-NoProfile', '-Command',
    '$zip = [System.IO.Compression.ZipFile]::Open($env:TEST_VSIX, [System.IO.Compression.ZipArchiveMode]::Update); try { $entry = $zip.CreateEntry("extension/.env"); $writer = [System.IO.StreamWriter]::new($entry.Open()); try { $writer.Write("TEST_FIXTURE=true") } finally { $writer.Dispose() } } finally { $zip.Dispose() }'],
  { cwd, encoding: 'utf8', env: { ...process.env, TEST_VSIX: vsix } });
  assert.equal(mutate.status, 0, mutate.stderr);
  const rejected = inspect();
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Unexpected VSIX entry/);
});
