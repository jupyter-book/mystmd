import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link } from './types';
import { GithubTransformer } from './github';

describe('Test GithubTransformer', () => {
  test('any github link', async () => {
    const file = new VFile();
    const t = new GithubTransformer();
    const url =
      'https://github.com/executablebooks/mystjs/blob/3cdb8ec6/packages/mystjs/src/mdast/state.ts#L32-L36';
    const raw =
      'https://raw.githubusercontent.com/executablebooks/mystjs/3cdb8ec6/packages/mystjs/src/mdast/state.ts';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe(url);
    expect(link.children).toEqual([{ type: 'text', value: 'packages/mystjs/src/mdast/state.ts' }]);
    expect(link.data?.raw).toEqual(raw);
    expect(link.data?.org).toEqual('executablebooks');
    expect(link.data?.repo).toEqual('mystjs');
    expect(link.data?.reference).toEqual('3cdb8ec6');
    expect(link.data?.file).toEqual('packages/mystjs/src/mdast/state.ts');
    expect(link.data?.from).toEqual(32);
    expect(link.data?.to).toEqual(36);
  });
  test('dont change other links', () => {
    const file = new VFile();
    const t = new GithubTransformer();
    const url = 'https://github.com/executablebooks/mystjs';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(link.data).toBeUndefined();
  });

  test('Check issue links', () => {
    const file = new VFile();
    const t = new GithubTransformer();
    const url = 'https://github.com/executablebooks/mystjs/issues/1';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.data).toEqual({
      kind: 'issue',
      org: 'executablebooks',
      repo: 'mystjs',
      issue_number: '1',
    });
  });
  test('Check pull request links', () => {
    const file = new VFile();
    const t = new GithubTransformer();
    const url = 'https://github.com/executablebooks/mystjs/pull/1';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.data).toEqual({
      kind: 'issue',
      org: 'executablebooks',
      repo: 'mystjs',
      issue_number: '1',
    });
  });
});
