import which from 'which';
import type { PageFrontmatter } from 'myst-frontmatter';
import { makeExecutable, silentLogger } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';

function gitCommandAvailable(): boolean {
  return !!which.sync('git', { nothrow: true });
}

export async function addEditUrl(session: ISession, frontmatter: PageFrontmatter, file: string) {
  if (frontmatter.edit || frontmatter.edit === null) return;
  if (!gitCommandAvailable()) return;
  try {
    const gitLog = silentLogger();
    const getGitOrigin = makeExecutable('git config --get remote.origin.url', gitLog);
    const gitOrigin =
      frontmatter.github ??
      (await getGitOrigin()).trim().replace('git@github.com:', 'https://github.com/');
    const getGitBranch = makeExecutable('git rev-parse --abbrev-ref HEAD', gitLog);
    const gitBranch = (await getGitBranch()).trim();
    const getGitRoot = makeExecutable('git rev-parse --show-toplevel', gitLog);
    const gitRoot = (await getGitRoot()).trim();
    if (gitOrigin && gitBranch && gitRoot && file.startsWith(gitRoot)) {
      frontmatter.edit = `${gitOrigin}/blob/${gitBranch}${file.replace(gitRoot, '')}`;
      session.log.debug(`Added edit URL ${frontmatter.edit} to ${file}`);
    }
  } catch {
    session.log.debug(`Unable to add edit URL to ${file}`);
  }
}
