import { resolvePath } from '../src/utils';

describe('utils', () => {
  describe('resolvePath', () => {
    test.each([
      [undefined, '', '.'],
      [undefined, 'main.thing', 'main.thing'],
      [undefined, '/absolute/path/main.thing', '/absolute/path/main.thing'],
      ['sep/path/', 'main.thing', 'sep/path/main.thing'],
      ['/sep/path/', 'main.thing', '/sep/path/main.thing'],
      ['sep/path/', 'stub/main.thing', 'sep/path/stub/main.thing'],
      ['/sep/path/', 'stub/main.thing', '/sep/path/stub/main.thing'],
    ])('%s %s => %s', (path: string | undefined, filename: string, expected: string) => {
      expect(resolvePath(path, filename)).toBe(expected);
    });
  });
});
