import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock git commands to avoid system dependencies.
// NOTE: These tests verify the logic that processes git output, not the git commands themselves.
vi.mock('which', () => ({ default: { sync: () => '/usr/bin/git' } }));
vi.mock('myst-cli-utils', () => ({
  silentLogger: () => ({ debug: () => {} }),
  makeExecutable: (command: string) => async () => {
    if (command.includes('--show-toplevel')) return '/repo\n';
    if (process.env.MOCK_GIT_FAIL) throw new Error('git failed');
    if (command.includes('origin/HEAD')) return process.env.MOCK_GIT_BRANCH ?? 'origin/main\n';
    return '';
  },
}));

import { addEditUrl } from './addEditUrl';

describe('addEditUrl', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GITHUB_BASE_REF;
    delete process.env.MOCK_GIT_FAIL;
    delete process.env.MOCK_GIT_BRANCH;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('strips origin/ prefix from branch name', async () => {
    process.env.MOCK_GIT_BRANCH = 'origin/develop\n';
    const frontmatter: any = { github: 'https://github.com/org/repo' };
    await addEditUrl({ log: { debug: vi.fn() } } as any, frontmatter, '/repo/docs/index.md');
    expect(frontmatter.edit_url).toBe('https://github.com/org/repo/edit/develop/docs/index.md');
    expect(frontmatter.source_url).toBe('https://github.com/org/repo/blob/develop/docs/index.md');
  });

  it('falls back to main when branch is HEAD', async () => {
    process.env.MOCK_GIT_BRANCH = 'HEAD\n';
    const frontmatter: any = { github: 'https://github.com/org/repo' };
    await addEditUrl({ log: { debug: vi.fn() } } as any, frontmatter, '/repo/docs/index.md');
    expect(frontmatter.edit_url).toContain('/edit/main/');
  });

  it('falls back to main when git throws', async () => {
    process.env.MOCK_GIT_FAIL = 'true';
    const session: any = { log: { debug: vi.fn() } };
    const frontmatter: any = { github: 'https://github.com/org/repo' };
    await addEditUrl(session, frontmatter, '/repo/docs/index.md');
    expect(frontmatter.edit_url).toContain('/edit/main/');
    expect(session.log.debug).toHaveBeenCalledWith(
      expect.stringContaining('Could not determine default branch'),
    );
  });

  it('respects edit_url: null without overwriting', async () => {
    const frontmatter: any = { github: 'https://github.com/org/repo', edit_url: null };
    await addEditUrl({ log: { debug: vi.fn() } } as any, frontmatter, '/repo/docs/index.md');
    expect(frontmatter.edit_url).toBeNull();
    expect(frontmatter.source_url).toContain('/blob/main/'); // source_url still generated
  });

  it('skips when both edit_url and source_url are null', async () => {
    const frontmatter: any = {
      github: 'https://github.com/org/repo',
      edit_url: null,
      source_url: null,
    };
    await addEditUrl({ log: { debug: vi.fn() } } as any, frontmatter, '/repo/docs/index.md');
    expect(frontmatter.edit_url).toBeNull();
    expect(frontmatter.source_url).toBeNull();
  });

  it('prefers GITHUB_BASE_REF over git', async () => {
    process.env.GITHUB_BASE_REF = 'develop';
    process.env.MOCK_GIT_BRANCH = 'origin/main\n'; // would be used if env var didn't take priority
    const frontmatter: any = { github: 'https://github.com/org/repo' };
    await addEditUrl({ log: { debug: vi.fn() } } as any, frontmatter, '/repo/docs/index.md');
    expect(frontmatter.edit_url).toContain('/edit/develop/');
  });
});
