import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { Session } from '../session';
import {
  directoryStructureToFileEntries,
  listExplicitFiles,
  objFromPathParts,
  patternToDirectoryStructure,
  sortByNumber,
} from './fromTOC';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

const session = new Session();

describe('sortByNumber', () => {
  it.each([
    ['a', 'b'],
    ['a', 'A'],
    ['A', 'b'],
    ['a0', 'a1'],
    ['a09', 'a10'],
    ['a9', 'a10'],
    ['a900000000', 'a1000000000'],
    ['a10000000000', 'a9000000000'],
  ])('%s is before %s', async (a, b) => {
    expect(sortByNumber(a, b)).toBe(-1);
  });
});

describe('objFromPathParts', () => {
  it('empty path parts gives empty object', async () => {
    expect(objFromPathParts([])).toEqual({});
  });
  it('empty path parts keeps object unchanged', async () => {
    expect(objFromPathParts([], { a: { b: {} } })).toEqual({ a: { b: {} } });
  });
  it('single path part returned in object', async () => {
    expect(objFromPathParts(['a'])).toEqual({ a: {} });
  });
  it('multiple path parts returned in object', async () => {
    expect(objFromPathParts(['a', 'b', 'c'])).toEqual({ a: { b: { c: {} } } });
  });
  it('separate path parts added to object', async () => {
    expect(objFromPathParts(['a', 'b', 'c'], { x: { y: { z: {} } } })).toEqual({
      a: { b: { c: {} } },
      x: { y: { z: {} } },
    });
  });
  it('overlapping path parts added to object', async () => {
    expect(objFromPathParts(['a', 'b', 'c'], { a: { b: { x: { y: {} } } } })).toEqual({
      a: { b: { c: {}, x: { y: {} } } },
    });
  });
});

describe('patternToDirectoryStructure', () => {
  beforeEach(() => memfs.vol.reset());
  it('pattern with no match returns empty structure', async () => {
    memfs.vol.fromJSON({ 'readme.md': '' });
    expect(patternToDirectoryStructure('', '.', { fs: memfs })).toEqual({});
  });
  it('pattern in empty directory returns empty structure', async () => {
    memfs.vol.fromJSON({});
    expect(patternToDirectoryStructure('**', '.', { fs: memfs })).toEqual({});
  });
  it('directory mapped to structure, respecting glob pattern', async () => {
    memfs.vol.fromJSON({
      'dir/README.md': '',
      'dir/a/index.md': '',
      'dir/a/image.png': '',
      'dir/a/b/data.dat': '',
      'dir/c/supplement.md': '',
      'dir/c/d/e/manuscript.pdf': '',
    });
    expect(patternToDirectoryStructure('dir/**', '.', { fs: memfs })).toEqual({
      dir: {
        'README.md': {},
        a: { 'index.md': {}, 'image.png': {}, b: { 'data.dat': {} } },
        c: { 'supplement.md': {}, d: { e: { 'manuscript.pdf': {} } } },
      },
    });
    expect(patternToDirectoryStructure('dir/*', '.', { fs: memfs })).toEqual({
      dir: {
        'README.md': {},
        a: {},
        c: {},
      },
    });
    expect(patternToDirectoryStructure('dir/**/*.md', '.', { fs: memfs })).toEqual({
      dir: {
        'README.md': {},
        a: { 'index.md': {} },
        c: { 'supplement.md': {} },
      },
    });
  });
});

describe('directoryStructureToFileEntries', () => {
  it('empty structure returns no entries', async () => {
    expect(directoryStructureToFileEntries({}, '.', [])).toEqual([]);
  });
  it('files are filtered and sorted', async () => {
    expect(
      directoryStructureToFileEntries({ 'c.ipynb': {}, 'a.md': {}, 'b.txt': {} }, '.', []),
    ).toEqual([
      {
        file: 'a.md',
      },
      {
        file: 'c.ipynb',
      },
    ]);
  });
  it('folders follow files', async () => {
    expect(directoryStructureToFileEntries({ a: { 'b.md': {} }, 'z.md': {} }, '.', [])).toEqual([
      {
        file: 'z.md',
      },
      {
        title: 'A',
        children: [
          {
            file: 'a/b.md',
          },
        ],
      },
    ]);
  });
  it('ignore is respected', async () => {
    expect(
      directoryStructureToFileEntries({ a: { 'b.md': {} }, 'z.md': {} }, '.', ['a/b.md']),
    ).toEqual([
      {
        file: 'z.md',
      },
      {
        title: 'A',
        children: [],
      },
    ]);
  });
  it('index files are first', async () => {
    expect(
      directoryStructureToFileEntries(
        { a: { 'b.md': {}, 'index.ipynb': {} }, 'c.md': {}, 'README.MD': {}, 'main.md': {} },
        '.',
        [],
      ),
    ).toEqual([
      {
        file: 'README.MD',
      },
      {
        file: 'c.md',
      },
      {
        file: 'main.md',
      },
      {
        title: 'A',
        children: [
          {
            file: 'a/index.ipynb',
          },
          {
            file: 'a/b.md',
          },
        ],
      },
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
