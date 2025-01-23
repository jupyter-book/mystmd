import which from 'which';
import type { PageFrontmatter } from 'myst-frontmatter';
import { makeExecutable, silentLogger } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';

function gitCommandAvailable(): boolean {
  return !!which.sync('git', { nothrow: true });
}

/**
 * Compute edit_url and add to frontmatter
 *
 * If edit_url is already defined on the page it will remain unchanged.
 * If edit_url is explicitly null or if github url is not defined, edit_url will not be set.
 * If git is not available to determine branch and top-level folder, edit_url will not be set.
 */
export async function addEditUrl(session: ISession, frontmatter: PageFrontmatter, file: string) {
  if (!frontmatter.github) return;
  if (frontmatter.edit_url || frontmatter.edit_url === null) return;
  if (!gitCommandAvailable()) return;
  try {
    const gitLog = silentLogger();
    const getGitBranch = makeExecutable('git rev-parse --abbrev-ref HEAD', gitLog);
    const gitBranch = (await getGitBranch()).trim();
    const getGitRoot = makeExecutable('git rev-parse --show-toplevel', gitLog);
    const gitRoot = (await getGitRoot()).trim();
    if (gitBranch && gitRoot && file.startsWith(gitRoot)) {
      frontmatter.edit_url = `${frontmatter.github}/blob/${gitBranch}${file.replace(gitRoot, '')}`;
      session.log.debug(`Added edit URL ${frontmatter.edit_url} to ${file}`);
    }
  } catch {
    session.log.debug(`Unable to add edit URL to ${file}`);
  }
}
