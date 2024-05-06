import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link, ResolvedExternalReference } from './types';
import { SphinxTransformer } from './sphinx';

export const TEST_REFERENCES: ResolvedExternalReference[] = [
  {
    key: 'no-kind',
    url: 'https://example.com/no-kind',
  },
  {
    key: 'no-value-myst',
    url: 'https://example.com/no-value-myst',
    kind: 'myst',
  },
  {
    key: 'no-value-sphinx',
    url: 'https://example.com/no-value-sphinx',
    kind: 'intersphinx',
  },
  {
    key: 'myst-ref',
    url: 'https://example.com/myst-ref',
    kind: 'myst',
    value: {
      version: '1',
      myst: '1.2.0',
      references: [
        {
          identifier: 'explicit_figure',
          html_id: 'explicit-figure',
          kind: 'figure',
          data: '/my-figure.json',
          url: '/my-figure',
        },
      ],
    },
  },
  {
    key: 'sphinx-ref-unloaded',
    url: 'https://example.com/sphinx-ref-unloaded',
    kind: 'intersphinx',
    value: {
      _loaded: false,
    } as any,
  },
  {
    key: 'sphinx-ref',
    url: 'https://example.com/sphinx-ref',
    kind: 'intersphinx',
    value: {
      _loaded: true,
      id: 'sphinx-ref',
      path: 'https://example.com/sphinx-ref',
      getEntry: ({ name }) => {
        if (name === 'sphinx-target') {
          return {
            location: 'https://example.com/sphinx-ref/my-target',
            display: 'My Target',
          };
        }
        return undefined;
      },
    } as any,
  },
];

describe('Test SphinxTransformer', () => {
  test('transform loads correctly', async () => {
    const t = new SphinxTransformer(TEST_REFERENCES);
    expect(t.intersphinx.length).toEqual(1);
  });
  test('valid link test passes', async () => {
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:sphinx-ref/some#nonsense',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
  });
  test('invalid link test fails', async () => {
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:myst-ref/some#nonsense',
      children: [],
    };
    expect(t.test(link.url)).toBe(false);
  });
  test('myst: prefix link test passes', async () => {
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'myst:sphinx-ref/some#nonsense',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
  });
  test('invalid link url errors', async () => {
    const file = new VFile();
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: "xref:sphinx-ref but this isn't a url!",
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('link with path errors', async () => {
    const file = new VFile();
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:sphinx-ref/path',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('valid link without target passes', async () => {
    const file = new VFile();
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:sphinx-ref',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(file.messages.length).toEqual(0);
    expect(link.internal).toBe(false);
    expect(link.url).toBe('https://example.com/sphinx-ref');
    expect(link.children[0].type).toEqual('text');
    expect((link.children[0] as any).value).toEqual('sphinx-ref');
  });
  test('link with invalid target fails', async () => {
    const file = new VFile();
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:sphinx-ref#bad-target',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('link with valid target passes', async () => {
    const file = new VFile();
    const t = new SphinxTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:sphinx-ref#sphinx-target',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(file.messages.length).toEqual(0);
    expect(link.internal).toBe(false);
    expect(link.url).toBe('https://example.com/sphinx-ref/my-target');
    expect(link.children[0].type).toEqual('text');
    expect((link.children[0] as any).value).toEqual('My Target');
  });
});
