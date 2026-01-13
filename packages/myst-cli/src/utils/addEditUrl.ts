import which from 'which';
import type { PageFrontmatter } from 'myst-frontmatter';
import { makeExecutable, silentLogger } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';

function gitCommandAvailable(): boolean {
  return !!which.sync('git', { nothrow: true });
}

/**
 * Infer a git branch to use for edit URLs.
 * Uses git rev-parse, but if this returns something that isn't a branch, it uses the `origin` default branch.
 * This is because many CI environments check out the repo in a way that rev-parse doesn't return the branch.
 */
async function getGitBranch(gitLog: ReturnType<typeof silentLogger>): Promise<string> {
  // First step try rev-parse
  const getBranchRevParse = makeExecutable('git rev-parse --abbrev-ref HEAD', gitLog);
  let gitBranch = (await getBranchRevParse()).trim();
  // Check for a few common failure-modes and get the origin branch if found
  // Assume detached HEAD returns "HEAD", and PR checkouts look like "pull/<id>".
  if (!gitBranch || gitBranch === 'HEAD' || gitBranch.startsWith('pull/')) {
    try {
      // origin/HEAD should point to the default branch (e.g. origin/main).
      const getDefaultBranch = makeExecutable(
        'git symbolic-ref --short refs/remotes/origin/HEAD',
        gitLog,
      );
      const defaultBranch = (await getDefaultBranch()).trim();
      if (defaultBranch) {
        // origin/HEAD should resolve to origin/<branch>; strip the remote prefix for URLs.
        gitBranch = defaultBranch.slice('origin/'.length);
      }
    } catch {
      // Keep original gitBranch if we cannot resolve a default branch.
    }
  }
  return gitBranch;
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
    const gitBranch = await getGitBranch(gitLog);
    const getGitRoot = makeExecutable('git rev-parse --show-toplevel', gitLog);
    const gitRoot = (await getGitRoot()).trim();
    if (gitBranch && gitRoot && file.startsWith(gitRoot)) {
      frontmatter.source_url = `${frontmatter.github}/blob/${gitBranch}${file.replace(gitRoot, '')}`;
      frontmatter.edit_url = `${frontmatter.github}/edit/${gitBranch}${file.replace(gitRoot, '')}`;
      session.log.debug(`Added edit URL ${frontmatter.edit_url} to ${file}`);
    }
  } catch {
    session.log.debug(`Unable to add edit URL to ${file}`);
  }
}
