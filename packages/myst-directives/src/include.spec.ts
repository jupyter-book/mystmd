import { describe, expect, test } from 'vitest';
import { parseLinesString } from './include.js';
import { VFile } from 'vfile';

describe('parseLinesString', () => {
  test.each([
    ['', undefined, 0],
    ['1,2', [1, 2], 0],
    ['1,2-', [1, [2]], 0],
    ['1,2-4', [1, [2, 4]], 0],
    ['1,2-4,a', [1, [2, 4]], 1],
    ['1,3,5-10,20-', [1, 3, [5, 10], [20]], 0],
    ['1,3,5 10,20-', [1, 3, [20]], 1],
  ])('"%s"', (t, a, w) => {
    const vfile = new VFile();
    expect(parseLinesString(vfile, {} as any, t)).toEqual(a);
    expect(vfile.messages.length).toEqual(w);
  });
});
