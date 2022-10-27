import { ensureSafePath } from '../src/minify/utils';

describe('minify.utils', () => {
  test.each([
    ['', ''],
    ['some-text/plain-thing', 'some-text-plain-thing'],
  ])('ensureSafePath', (input: string, expected: string) => {
    expect(ensureSafePath(input)).toEqual(expected);
  });
});
