import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { parseMultiExt } from './filesystem';

describe('parseMultiExt', () => {
  it.each([
    ['image.png', 'image', '.png'],
    ['archive.tar.gz', 'archive', '.tar.gz'],
    ['report.2026.final.pdf', 'report', '.2026.final.pdf'],
    ['README', 'README', ''],
    ['.bashrc', '.bashrc', ''],
    ['.hidden.tar.gz', '.hidden', '.tar.gz'],
  ])('splits %s into name and full extension', (base, name, ext) => {
    expect(parseMultiExt(base)).toMatchObject({ name, ext, base });
  });
  it('keeps the directory fields from path.parse', () => {
    const file = path.join('some', 'folder', 'archive.tar.gz');
    expect(parseMultiExt(file)).toMatchObject({
      dir: path.join('some', 'folder'),
      base: 'archive.tar.gz',
      name: 'archive',
      ext: '.tar.gz',
    });
  });
});
