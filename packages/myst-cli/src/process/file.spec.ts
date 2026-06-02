import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { Session } from '../session';
import { loadFile, loadFrontmatterParts } from './file';
import * as resolveModule from '../utils/resolveToAbsolute.js';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

beforeEach(() => memfs.vol.reset());

const session = new Session();

describe('loadFile', () => {
  it('invalid notebook does not error', async () => {
    memfs.vol.fromJSON({ 'notebook.ipynb': '{"invalid_notebook": "yes"}' });
    expect(await loadFile(session, 'notebook.ipynb')).toEqual(undefined);
  });
});

describe('loadFrontmatterParts', () => {
  it('loads remote URL parts from cache', async () => {
    // This mocks the step that does a URL fetch so we don't do it here.
    // resolveToAbsolute should return the path where remote file is cached
    vi.spyOn(resolveModule, 'resolveToAbsolute').mockResolvedValue('/cache/footer.md');
    // Create the cached file that would have been fetched
    memfs.vol.fromJSON({
      '/project/myst.yml': 'version: 1',
      '/cache/footer.md': '# Footer',
    });

    const result = await loadFrontmatterParts(
      session,
      '/project/myst.yml',
      'site.parts',
      { parts: { footer: ['https://example.com/footer.md'] } },
      '/project',
    );

    // Verify URL was resolved to cached path
    expect(result.footer).toEqual(['/cache/footer.md']);
  });
});
