import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { Session } from '../session';
import { listExplicitFiles, patternsToFileEntries } from './fromTOC';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

const session = new Session();

describe('patternsToFileEntries', () => {
  beforeEach(() => memfs.vol.reset());
  it('non-matching patterns resolve to empty entries', () => {
    memfs.vol.fromJSON({ 'readme.md': '' });
    expect(
      patternsToFileEntries(session, [{ pattern: 'foo-*.md' }], '.', [], '/tmp/warn.txt', {
        fs: memfs,
      }),
    ).toEqual([]);
  });
  it('patterns tested against empty file-system resolve to empty entries', () => {
    memfs.vol.fromJSON({});
    expect(
      patternsToFileEntries(session, [{ pattern: 'foo-*.md' }], '.', [], '/tmp/warn.txt', {
        fs: memfs,
      }),
    ).toEqual([]);
  });
  it('patterns tested against nested folders respect folder precedence', () => {
    memfs.vol.fromJSON({
      'foo/file-1.md': '',
      'foo/file-10.md': '',
      'foo/file-3.md': '',
      'bar/file-2.md': '',
      'bar/file-9.md': '',
    });
    expect(
      patternsToFileEntries(session, [{ pattern: '**/file-*.md' }], '.', [], '/tmp/warn.txt', {
        fs: memfs,
      }),
    ).toEqual([
      { file: 'bar/file-2.md', implicit: true },
      { file: 'bar/file-9.md', implicit: true },
      { file: 'foo/file-1.md', implicit: true },
      { file: 'foo/file-3.md', implicit: true },
      { file: 'foo/file-10.md', implicit: true },
    ]);
  });
  it('files containing natural numbers are sorted correctly', () => {
    memfs.vol.fromJSON({
      'foo/file-2.md': '',
      'foo/file-01.md': '',
      'foo/file-10.md': '',
      'foo/file-3.md': '',
    });
    expect(
      patternsToFileEntries(session, [{ pattern: '**/file-*.md' }], '.', [], '/tmp/warn.txt', {
        fs: memfs,
      }),
    ).toEqual([
      { file: 'foo/file-01.md', implicit: true },
      { file: 'foo/file-2.md', implicit: true },
      { file: 'foo/file-3.md', implicit: true },
      { file: 'foo/file-10.md', implicit: true },
    ]);
  });
  it('directories with index files are sorted correctly', () => {
    memfs.vol.fromJSON({
      'foo/file-2.md': '',
      'foo/file-10.md': '',
      'foo/index.ipynb': '',
      'foo/file-3.md': '',
      'bar/index.md': '',
      'bar/file-8.md': '',
      'bar/file-1.md': '',
      'bar/file-10.md': '',
    });
    expect(
      patternsToFileEntries(session, [{ pattern: '**/*' }], '.', [], '/tmp/warn.txt', {
        fs: memfs,
      }),
    ).toEqual([
      { file: 'bar/index.md', implicit: true },
      { file: 'bar/file-1.md', implicit: true },
      { file: 'bar/file-8.md', implicit: true },
      { file: 'bar/file-10.md', implicit: true },
      { file: 'foo/index.ipynb', implicit: true },
      { file: 'foo/file-2.md', implicit: true },
      { file: 'foo/file-3.md', implicit: true },
      { file: 'foo/file-10.md', implicit: true },
    ]);
  });
});

describe('listExplicitFiles', () => {
  it('empty entries have no files', async () => {
    expect(listExplicitFiles([], '.')).toEqual([]);
  });
  it('entries with only folders has no files', async () => {
    expect(listExplicitFiles([{ title: 'A', children: [] }], '.')).toEqual([]);
  });
  it('entries with simple files are listed correctly', async () => {
    expect(
      listExplicitFiles(
        [
          {
            file: 'a.md',
          },
          {
            file: 'c.ipynb',
          },
        ],
        '.',
      ).length,
    ).toEqual(2);
  });
  it('entries with files and folders are listed correctly', async () => {
    expect(
      listExplicitFiles(
        [
          {
            file: 'a.md',
          },
          {
            title: 'B',
            children: [
              {
                file: 'c.ipynb',
              },
              {
                title: 'D',
                children: [
                  {
                    file: 'e.ipynb',
                  },
                ],
              },
            ],
          },
        ],
        '.',
      ).length,
    ).toEqual(3);
  });
});
