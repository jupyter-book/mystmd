import { describe, expect, test } from 'vitest';
import { filterIncludedContent } from './include';
import { VFile } from 'vfile';

describe('filterIncludedContent', () => {
  test.each([
    [{ startAt: 'ok' }, 'ok\nreally\ncool', 2, 0],
    [{ startAt: 'ok', endBefore: 'cool' }, 'ok\nreally', 2, 0],
    [{ startAt: 'ok', endBefore: 'ok' }, 'ok\nreally\ncool', 2, 1],
    [{ startAt: 'ok', endAt: 'cool' }, 'ok\nreally\ncool', 2, 0],
    [{ startAfter: 'k', endBefore: 'cool' }, 'really', 3, 0],
    [{ endBefore: 'cool' }, 'some\nok\nreally', 1, 0],
    [{ startAt: 'really' }, 'really\ncool', 3, 0],
    [{ startAfter: 'really' }, 'cool', 4, 0],
    [{ lines: [1, 3] }, 'some\nreally', 1, 0],
    [{ lines: [[1, 3]] }, 'some\nok\nreally', 1, 0],
    [{ lines: [1, [3]] }, 'some\nreally\ncool', 1, 0],
    [{ lines: [2, 1, 2] }, 'ok\nsome\nok', 2, 0],
    [{ lines: [1, -1] }, 'some\ncool', 1, 0],
    [{ lines: [-1] }, 'cool', 4, 0],
    [{ lines: [1, [-1]] }, 'some\ncool', 1, 0],
    [{ lines: [1, [-2]] }, 'some\nreally\ncool', 1, 0],
    [{ lines: [1, [-2, -1]] }, 'some\nreally\ncool', 1, 0],
    [{ lines: [1, [-1, -2]] }, 'some', 1, 1],
  ])('%s', (t, a, sln, w) => {
    const vfile = new VFile();
    const { content, startingLineNumber } = filterIncludedContent(
      vfile,
      t as any,
      'some\nok\nreally\ncool',
    );
    expect(content).toEqual(a);
    expect(startingLineNumber).toEqual(sln);
    expect(vfile.messages.length).toBe(w);
  });
});
