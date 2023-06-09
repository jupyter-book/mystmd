import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link } from './types';
import { DOITransformer } from './doi';

describe('Test GithubTransformer', () => {
  test('any github link', async () => {
    const file = new VFile();
    const t = new DOITransformer();
    const url = 'https://doi.org/10.1016/j.ultramic.2018.06.001';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe(url);
    expect(link.data?.doi).toEqual('10.1016/j.ultramic.2018.06.001');
  });
});
