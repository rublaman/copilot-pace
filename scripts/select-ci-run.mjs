import { execFileSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function selectCiRun(runs, sha, branch) {
  if (!/^[a-f0-9]{40}$/.test(sha) || !['main', 'develop'].includes(branch) || !Array.isArray(runs)) {
    throw new Error('Invalid candidate SHA, branch or CI run list.');
  }
  const run = runs.find(item => item.headSha === sha && item.headBranch === branch &&
    item.event === 'push' && item.status === 'completed' && item.conclusion === 'success' &&
    Number.isSafeInteger(item.databaseId) && item.databaseId > 0);
  if (!run) throw new Error(`No successful ${branch} push CI run found for ${sha}.`);
  return run.databaseId;
}

async function main() {
  const { RELEASE_SHA: sha, RELEASE_BRANCH: branch, GITHUB_OUTPUT: output } = process.env;
  if (!output) throw new Error('GITHUB_OUTPUT is required.');
  if (!/^[a-f0-9]{40}$/.test(sha ?? '') || !['main', 'develop'].includes(branch)) {
    throw new Error('Invalid candidate SHA or branch.');
  }
  const result = execFileSync('gh', [
    'run', 'list', '--workflow', 'ci.yml', '--branch', branch, '--event', 'push', '--commit', sha,
    '--status', 'success', '--limit', '100', '--json', 'databaseId,headSha,headBranch,event,status,conclusion',
  ], { encoding: 'utf8' });
  const id = selectCiRun(JSON.parse(result), sha, branch);
  await appendFile(output, `run_id=${id}\n`);
  console.log(`Selected successful ${branch} CI run ${id} for ${sha}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();