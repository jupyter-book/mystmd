import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { isValidFile, resolveExtension, parseFilePath } from './resolveExtension';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

describe('resolveExtension', () => {
  beforeEach(() => memfs.vol.reset());
  it('existing file with extension is returned', async () => {
    memfs.vol.fromJSON({ 'readme.abc': '', 'readme.md': '' });
    expect(resolveExtension('readme.abc')).toEqual('readme.abc');
  });
  it('existing file without extension coerces and warns', async () => {
    memfs.vol.fromJSON({ 'readme.abc': '', 'readme.md': '' });
    const counts = { warn: 0, error: 0 };
    expect(
      resolveExtension('readme', (message, level) => {
        if (level === 'warn') counts.warn += 1;
        if (level === 'error') counts.error += 1;
      }),
    ).toEqual('readme.md');
    expect(counts.warn).toBe(1);
    expect(counts.error).toBe(0);
  });
  it('existing file without extension matches case', async () => {
    memfs.vol.fromJSON({ 'readme.abc': '', 'readme.MD': '' });
    expect(resolveExtension('readme')).toEqual('readme.MD');
  });
  it('existing directory warns when warnFn is provided', async () => {
    memfs.vol.fromJSON({ 'readme.abc': '', 'readme.md': '', 'readme/file.md': '' });
    const counts = { warn: 0, error: 0 };
    expect(
      resolveExtension('readme', (message, level) => {
        if (level === 'warn') counts.warn += 1;
        if (level === 'error') counts.error += 1;
      }),
    ).toBe(undefined);
    expect(counts.warn).toBe(0);
    expect(counts.error).toBe(1);
  });
  it('existing directory ignored when warnFn is not provided', async () => {
    memfs.vol.fromJSON({ 'readme.abc': '', 'readme.ipynb': '', 'readme/file.md': '' });
    expect(resolveExtension('readme')).toBe('readme.ipynb');
  });
  it('matching multiple files without extension errors and returns only one', async () => {
    memfs.vol.fromJSON({ 'readme.ipynb': '', 'readme.md': '' });
    const counts = { warn: 0, error: 0 };
    expect(
      resolveExtension('readme', (message, level) => {
        if (level === 'warn') counts.warn += 1;
        if (level === 'error') counts.error += 1;
      }),
    ).toEqual('readme.md');
    expect(counts.warn).toBe(0);
    expect(counts.error).toBe(1);
  });
  it('nonexistent file errors', async () => {
    memfs.vol.fromJSON({});
    const counts = { warn: 0, error: 0 };
    expect(
      resolveExtension('readme.md', (message, level) => {
        if (level === 'warn') counts.warn += 1;
        if (level === 'error') counts.error += 1;
      }),
    ).toBe(undefined);
    expect(counts.warn).toBe(0);
    expect(counts.error).toBe(1);
  });
});

describe('isValidFile', () => {
  it.each(['index.md', 'INDEX.MD', 'my-paper.tex', 'untitled.ipynb'])(`%s is valid`, async (f) => {
    expect(isValidFile(f)).toBe(true);
  });
  it.each(['index.txt', 'INDEX', 'my-paper.latex'])(`%s is invalid`, async (f) => {
    expect(isValidFile(f)).toBe(false);
  });
});

describe('parseFilePath', () => {
  it.each([
    ['/tmp/foo/bar.md', { dir: '/tmp/foo', name: 'bar', ext: '.md' }],
    ['/tmp/foo/bar/bat.txt', { dir: '/tmp/foo/bar', name: 'bat', ext: '.txt' }],
    ['/tmp/baz.myst.json', { dir: '/tmp', name: 'baz', ext: '.myst.json' }],
  ])('%s parses properly', (path, result) => {
    expect(parseFilePath(path)).toEqual(result);
  });
});
