import which from 'which';
import type { PageFrontmatter } from 'myst-frontmatter';
import { makeExecutable, silentLogger } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';

function gitCommandAvailable(): boolean {
  return !!which.sync('git', { nothrow: true });
}

/**
 * Compute edit_url/source_url and add to frontmatter.
 *
 * If edit_url/source_url is already defined or null it remains unchanged.
 * "null" is treated as "don't show" at both project and page level
 */
export async function addEditUrl(session: ISession, frontmatter: PageFrontmatter, file: string) {
  if (!frontmatter.github) return;
  // Skip if both URLs are already set (either to a value or explicitly null)
  if (frontmatter.edit_url !== undefined && frontmatter.source_url !== undefined) return;
  if (!gitCommandAvailable()) return;

  try {
    const gitLog = silentLogger();
    const getGitBranch = makeExecutable('git rev-parse --abbrev-ref HEAD', gitLog);
    const gitBranch = (await getGitBranch()).trim();
    const getGitRoot = makeExecutable('git rev-parse --show-toplevel', gitLog);
    const gitRoot = (await getGitRoot()).trim();
    if (!gitBranch || !gitRoot || !file.startsWith(gitRoot)) return;

    const filePath = file.replace(gitRoot, '');

    if (frontmatter.source_url === undefined) {
      frontmatter.source_url = `${frontmatter.github}/blob/${gitBranch}${filePath}`;
    }
    if (frontmatter.edit_url === undefined) {
      frontmatter.edit_url = `${frontmatter.github}/edit/${gitBranch}${filePath}`;
      session.log.debug(`Added edit URL ${frontmatter.edit_url}`);
    }
  } catch {
    session.log.debug(`Unable to add edit URL for ${file}`);
  }
}
