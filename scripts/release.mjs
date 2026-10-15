import { execFileSync } from 'node:child_process';
import { appendFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const numericVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function releaseMetadata(manifest, lock, tag, changelog, licensePresent) {
  const version = tag.startsWith('v') ? tag.slice(1) : '';
  if (!numericVersion.test(version)) throw new Error('Use an annotated numeric tag: vMAJOR.MINOR.PATCH.');
  if (manifest.version !== version || lock.version !== version || lock.packages?.['']?.version !== version) {
    throw new Error('Tag, manifest and lockfile versions must agree.');
  }
  if (typeof manifest.preview !== 'boolean') throw new Error('Set preview explicitly to true (pilot) or false (stable).');
  if (!manifest.preview && version.startsWith('0.')) throw new Error('Stable releases start at 1.0.0.');
  if (!manifest.license || manifest.license === 'UNLICENSED' || !licensePresent) {
    throw new Error('Choose distribution terms and add a license file before releasing.');
  }
  const match = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}\r?$/gm)].find(entry => entry[1] === version);
  if (!match) throw new Error('Add a dated changelog entry for the release version.');
  const changes = changelog.slice(match.index + match[0].length).split(/^## /m)[0].trim();
  if (!changes || /\b(TODO|TBD)\b/i.test(changes)) throw new Error('Complete the changelog entry before releasing.');
  return { version, branch: manifest.preview ? 'develop' : 'main', prerelease: manifest.preview, changes };
}

export async function validateRelease(tag) {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  // Validate the ref before passing it to Git, even when invoked outside Actions.
  if (!tag || !tag.startsWith('v') || !numericVersion.test(tag.slice(1))) throw new Error('Invalid release tag.');
  if (git('cat-file', '-t', `refs/tags/${tag}`) !== 'tag') throw new Error('The release tag must be annotated.');
  const sha = git('rev-parse', `refs/tags/${tag}^{commit}`);
  if (sha !== git('rev-parse', 'HEAD')) throw new Error('Check out the tagged commit before validation.');
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  const changelog = await readFile('CHANGELOG.md', 'utf8');
  const license = (await readdir('.')).find(name => /^licen[cs]e(?:\.(?:md|txt))?$/i.test(name));
  const metadata = releaseMetadata(manifest, lock, tag, changelog, Boolean(license));
  git('ls-files', '--error-unmatch', 'README.md', 'CHANGELOG.md', license);
  git('merge-base', '--is-ancestor', sha, `origin/${metadata.branch}`);
  if (git('status', '--porcelain')) throw new Error('Release validation requires a clean checkout.');
  const notes = `# Copilot Pace ${metadata.version}\n\n${metadata.changes}\n\n` +
    (metadata.prerelease ? 'Pilot: real account and corporate network validation is pending.\n\n' : '') +
    `Commit: ${sha}\n\nBefore publishing this draft, record manual validation of the attached VSIX and review its checksum.\n`;
  await writeFile('dist-release-notes.md', notes);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `version=${metadata.version}\nsha=${sha}\nprerelease=${metadata.prerelease}\n`);
  }
  console.log(`Validated ${tag} on ${metadata.branch} at ${sha}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await validateRelease(process.argv[2]);
}
