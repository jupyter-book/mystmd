import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link } from 'myst-spec-ext';
import { GithubTransformer } from './github';

describe('Test GithubTransformer', () => {
  test('any github link', async () => {
    const file = new VFile();
    const t = new GithubTransformer();
    const url =
      'https://github.com/jupyter-book/mystmd/blob/3cdb8ec6/packages/mystmd/src/mdast/state.ts#L32-L36';
    const raw =
      'https://raw.githubusercontent.com/jupyter-book/mystmd/3cdb8ec6/packages/mystmd/src/mdast/state.ts';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe(url);
    expect(link.children).toEqual([{ type: 'text', value: 'packages/mystmd/src/mdast/state.ts' }]);
    expect(link.data?.raw).toEqual(raw);
    expect(link.data?.org).toEqual('jupyter-book');
    expect(link.data?.repo).toEqual('mystmd');
    expect(link.data?.reference).toEqual('3cdb8ec6');
    expect(link.data?.file).toEqual('packages/mystmd/src/mdast/state.ts');
    expect(link.data?.from).toEqual(32);
    expect(link.data?.to).toEqual(36);
  });
  test('dont change other links', () => {
    const file = new VFile();
    const t = new GithubTransformer();
    const url = 'https://github.com/jupyter-book/mystmd';
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
    const url = 'https://github.com/jupyter-book/mystmd/issues/1';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.data).toEqual({
      kind: 'issue',
      org: 'jupyter-book',
      repo: 'mystmd',
      issue_number: '1',
    });
  });
  test('Check pull request links', () => {
    const file = new VFile();
    const t = new GithubTransformer();
    const url = 'https://github.com/jupyter-book/mystmd/pull/1';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.data).toEqual({
      kind: 'issue',
      org: 'jupyter-book',
      repo: 'mystmd',
      issue_number: '1',
    });
  });
});
