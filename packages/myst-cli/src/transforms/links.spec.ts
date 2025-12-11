import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import path from 'path';
import { fileFromRelativePath, fileFromSourceFolder, getSourceFolder, checkLink } from './links';
import type { ISession } from '../session/types.js';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

beforeEach(() => memfs.vol.reset());

describe('fileFromRelativePath', () => {
  it('non-existent returns undefined', async () => {
    memfs.vol.fromJSON({});
    expect(fileFromRelativePath('readme')).toEqual(undefined);
  });
  it('url returns undefined', async () => {
    memfs.vol.fromJSON({});
    expect(fileFromRelativePath('https://example.com')).toEqual(undefined);
  });
  it('file returns file', async () => {
    memfs.vol.fromJSON({ 'readme.pdf': '' });
    expect(fileFromRelativePath('readme.pdf')).toEqual('readme.pdf');
  });
  it('file returns file (decodeURI)', async () => {
    memfs.vol.fromJSON({ 'notebooks/Joint EM inversion.ipynb': '' });
    expect(fileFromRelativePath('notebooks/Joint%20EM%20inversion')).toEqual(
      'notebooks/Joint EM inversion.ipynb',
    );
    expect(fileFromRelativePath('notebooks/Joint%20EM%20inversion.ipynb')).toEqual(
      'notebooks/Joint EM inversion.ipynb',
    );
    expect(fileFromRelativePath('notebooks/Joint EM inversion.ipynb')).toEqual(
      'notebooks/Joint EM inversion.ipynb',
    );
  });
  it('file with no ext returns ipynb file', async () => {
    memfs.vol.fromJSON({ 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.ipynb');
  });
  it('file with no ext prefers md', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'readme.ipynb': '' });
    expect(fileFromRelativePath('readme')).toEqual('readme.md');
  });
  it('file in folder', async () => {
    memfs.vol.fromJSON({ 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('folder/readme')).toEqual('folder/readme.md');
  });
  it('file in path', async () => {
    memfs.vol.fromJSON({ 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('readme', 'folder/readme.ipynb')).toMatch(/folder\/readme.md$/);
  });
  it('file up a directory', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    const file = fileFromRelativePath('../readme', 'folder/readme.ipynb');
    expect(file).toMatch(/\/readme.md$/);
    expect(file).not.toMatch(/folder\/readme.md$/);
  });
  it('hash passed through', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'folder/readme.md': '', 'folder/readme.ipynb': '' });
    expect(fileFromRelativePath('../readme#target#etc', 'folder/readme.ipynb')).toMatch(
      /\/readme.md#target#etc$/,
    );
  });
});

describe('checkLink', () => {
  const createMockSession = (): ISession =>
    ({
      store: {
        getState: vi.fn().mockReturnValue({
          local: {
            links: {},
          },
        }),
        dispatch: vi.fn(),
      },
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      fetch: vi.fn(),
    }) as any;

  it('skips mailto links', async () => {
    const session = createMockSession();
    const result = await checkLink(session, 'mailto:test@example.com');
    expect(result.skipped).toBe(true);
    expect(result.url).toBe('mailto:test@example.com');
  });

  it('skips example.com domains', async () => {
    const session = createMockSession();
    const testUrls = [
      'https://example.com/page',
      'https://www.example.com/page',
      'http://example.com/page',
    ];

    for (const url of testUrls) {
      const result = await checkLink(session, url);
      expect(result.skipped).toBe(true);
      expect(result.url).toBe(url);
    }
  });

  it('skips example.org domains', async () => {
    const session = createMockSession();
    const testUrls = [
      'https://example.org/page',
      'https://www.example.org/page',
      'http://example.org/test',
    ];

    for (const url of testUrls) {
      const result = await checkLink(session, url);
      expect(result.skipped).toBe(true);
      expect(result.url).toBe(url);
    }
  });

  it('skips example.net domains', async () => {
    const session = createMockSession();
    const testUrls = [
      'https://example.net/page',
      'https://www.example.net/page',
      'http://example.net/documentation',
    ];

    for (const url of testUrls) {
      const result = await checkLink(session, url);
      expect(result.skipped).toBe(true);
      expect(result.url).toBe(url);
    }
  });

  it('skips other blocked domains', async () => {
    const session = createMockSession();
    const testUrls = [
      'https://linkedin.com/in/user',
      'https://twitter.com/user',
      'https://medium.com/article',
      'https://en.wikipedia.org/wiki/Article',
    ];

    for (const url of testUrls) {
      const result = await checkLink(session, url);
      expect(result.skipped).toBe(true);
      expect(result.url).toBe(url);
    }
  });

  it('does not skip non-blocked domains', async () => {
    const session = createMockSession();
    // The test simply verifies that the domain is not in the skip list
    // For non-skipped domains, we don't test the full fetch logic here
    const result = await checkLink(session, 'https://github.com/user/repo');
    // If not skipped, the result should have been attempted to fetch
    // (even if it fails, it shouldn't have the skipped flag)
    expect(result.skipped).toBeUndefined();
    expect(result.url).toBe('https://github.com/user/repo');
  });
});

describe('getSourceFolder', () => {
  const projectFolder = '/project';
  const sourceFile = '/project/docs/readme.md';

  it('returns project folder when link starts with path separator', () => {
    const result = getSourceFolder('/images/pic.png', sourceFile, projectFolder);
    expect(result).toBe(projectFolder);
  });

  it('returns source file directory when link is relative', () => {
    const result = getSourceFolder('images/pic.png', sourceFile, projectFolder);
    expect(result).toBe(path.dirname(sourceFile));
  });

  it('handles nested source files', () => {
    const deeplyNested = '/project/docs/notes/intro.md';
    const result = getSourceFolder('figure.png', deeplyNested, projectFolder);
    expect(result).toBe(path.dirname(deeplyNested));
  });
});

describe('fileFromSourceFolder', () => {
  it('returns undefined for non-existent file', () => {
    memfs.vol.fromJSON({});
    const result = fileFromSourceFolder('missing.md');
    expect(result).toBeUndefined();
  });

  it('returns undefined if path is a directory', () => {
    memfs.vol.fromJSON({ 'folder/': null });
    const result = fileFromSourceFolder('folder');
    expect(result).toBeUndefined();
  });

  it('resolves relative path from folder', () => {
    memfs.vol.fromJSON({ 'src/readme.md': '' });
    const result = fileFromSourceFolder('readme.md', 'src');
    expect(result).toMatch(/src\/readme\.md$/);
  });

  it('resolves missing extension to .md if available', () => {
    memfs.vol.fromJSON({ 'docs/readme.md': '' });
    const result = fileFromSourceFolder('readme', 'docs');
    expect(result).toMatch(/docs\/readme\.md$/);
  });

  it('resolves missing extension to .ipynb if .md not available', () => {
    memfs.vol.fromJSON({ 'docs/readme.ipynb': '' });
    const result = fileFromSourceFolder('readme', 'docs');
    expect(result).toMatch(/docs\/readme\.ipynb$/);
  });

  it('returns undefined if neither .md nor .ipynb exist', () => {
    memfs.vol.fromJSON({});
    const result = fileFromSourceFolder('missing', 'docs');
    expect(result).toBeUndefined();
  });

  it('preserves hash fragments', () => {
    memfs.vol.fromJSON({ 'docs/readme.md': '' });
    const result = fileFromSourceFolder('readme#section-2', 'docs');
    expect(result).toMatch(/docs\/readme\.md#section-2$/);
  });

  it('decodes URI components before lookup', () => {
    memfs.vol.fromJSON({ 'docs/Joint EM inversion.ipynb': '' });
    const result = fileFromSourceFolder('Joint%20EM%20inversion', 'docs');
    expect(result).toMatch(/docs\/Joint EM inversion\.ipynb$/);
  });

  it('resolves absolute path correctly', () => {
    memfs.vol.fromJSON({ '/project/docs/readme.md': '' });
    const result = fileFromSourceFolder('/project/docs/readme.md');
    expect(result).toBe('/project/docs/readme.md');
  });

  it('handles nested relative path resolution', () => {
    memfs.vol.fromJSON({ 'project/docs/sub/file.md': '' });
    const result = fileFromSourceFolder('../docs/sub/file', 'project/notes');
    expect(result).toMatch(/project\/docs\/sub\/file\.md$/);
  });
});
