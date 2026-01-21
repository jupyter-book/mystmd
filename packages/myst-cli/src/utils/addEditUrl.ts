import which from 'which';
import type { PageFrontmatter } from 'myst-frontmatter';
import { makeExecutable, silentLogger } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';

function gitCommandAvailable(): boolean {
  return !!which.sync('git', { nothrow: true });
}

/**
 * Get the default branch name for edit URLs.
 *
 * We always use the repository's default branch (e.g. "main") rather than the current
 * branch because edit URLs should point to the canonical version that readers can edit,
 * not a transient feature branch or CI checkout.
 *
 * Priority:
 * 1. GITHUB_BASE_REF env var (set by GitHub Actions in PR builds to the target branch)
 * 2. origin/HEAD via git (points to the remote's default branch)
 * 3. Fallback to "main" if git fails (e.g. shallow clone, missing remote)
 */
async function getDefaultBranch(session: ISession): Promise<string> {
  if (process.env.GITHUB_BASE_REF) return process.env.GITHUB_BASE_REF;

  try {
    const gitLog = silentLogger();
    // origin/HEAD is a symbolic ref pointing to the default branch (e.g. origin/main)
    const exec = makeExecutable('git symbolic-ref --short refs/remotes/origin/HEAD', gitLog);
    const result = (await exec()).trim().replace(/^origin\//, '');
    // In detached HEAD state, this can return "HEAD" which isn't useful
    if (result && result !== 'HEAD') return result;
  } catch {
    // Git command can fail in shallow clones or if origin/HEAD isn't set
  }

  session.log.debug('Could not determine default branch for edit URL, using "main"');
  return 'main';
}

/**
 * Auto-generate edit_url and source_url for a page based on its GitHub repo.
 *
 * These URLs let readers view or propose edits to the source file:
 * - source_url: links to /blob/ (read-only view)
 * - edit_url: links to /edit/ (GitHub's web editor)
 *
 * Users can override by setting these in frontmatter:
 * - Set to a string: use that URL instead
 * - Set to null: disable the URL entirely (won't be generated)
 */
export async function addEditUrl(session: ISession, frontmatter: PageFrontmatter, file: string) {
  // Need a github URL to construct edit links
  if (!frontmatter.github) return;

  // Users can set these to null in frontmatter to explicitly disable them
  if (frontmatter.edit_url === null && frontmatter.source_url === null) return;

  // Skip if both URLs are already provided (user override)
  if (frontmatter.edit_url && frontmatter.source_url) return;

  if (!gitCommandAvailable()) return;

  try {
    // Find the repository root to compute relative file paths
    const gitLog = silentLogger();
    const getGitRoot = makeExecutable('git rev-parse --show-toplevel', gitLog);
    const gitRoot = (await getGitRoot()).trim();
    if (!gitRoot || !file.startsWith(gitRoot)) return;

    const branch = await getDefaultBranch(session);
    const filePath = file.replace(gitRoot, '');

    // Only set URLs that aren't already defined (and aren't explicitly null)
    if (!frontmatter.source_url && frontmatter.source_url !== null) {
      frontmatter.source_url = `${frontmatter.github}/blob/${branch}${filePath}`;
    }
    if (!frontmatter.edit_url && frontmatter.edit_url !== null) {
      frontmatter.edit_url = `${frontmatter.github}/edit/${branch}${filePath}`;
      session.log.debug(`Added edit URL ${frontmatter.edit_url}`);
    }
  } catch {
    session.log.debug(`Unable to add edit URL for ${file}`);
  }
}
