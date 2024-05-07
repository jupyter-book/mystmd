import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link, ResolvedExternalReference } from './types';
import { MystTransformer } from './myst';

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
        {
          identifier: 'implicit-heading',
          kind: 'heading',
          data: '/my-heading.json',
          url: '/my-heading',
          implicit: true,
        },
        {
          kind: 'page',
          data: '/index.json',
          url: '/',
        },
        {
          identifier: 'page-id',
          kind: 'page',
          data: '/index.json',
          url: '/',
        },
        {
          identifier: 'implicit-root-heading',
          kind: 'heading',
          data: '/index.json',
          url: '/',
          implicit: true,
        },
        {
          kind: 'page',
          data: '/my-page.json',
          url: '/my-page',
        },
        {
          identifier: 'my-page-id',
          kind: 'page',
          data: '/my-page.json',
          url: '/my-page',
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
            location: '/my-target',
            display: 'My Target',
          };
        }
        return undefined;
      },
    } as any,
  },
];

describe('Test MystTransformer', () => {
  test('transform loads correctly', async () => {
    const t = new MystTransformer(TEST_REFERENCES);
    expect(t.mystXRefsList.length).toEqual(1);
  });
  test('valid link test passes', async () => {
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:myst-ref/some#nonsense',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
  });
  test('invalid link test fails', async () => {
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:sphinx-ref/some#nonsense',
      children: [],
    };
    expect(t.test(link.url)).toBe(false);
  });
  test('myst: prefix link test passes', async () => {
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'myst:myst-ref/some#nonsense',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
  });
  test('invalid link url errors', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: "xref:myst-ref but this isn't a url!",
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('link with invalid id errors', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:myst-ref-oops',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('implicit reference does not resolve with only target', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:myst-ref#implicit-heading',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('reference does not resolve with mismatched path', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:myst-ref/my-heading#explicit_figure',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test.each([
    ['identifier', '', 'explicit_figure'],
    ['html_id', '', 'explicit-figure'],
    ['path and identifier', '/my-figure', 'explicit_figure'],
    ['path and html_id', '/my-figure', 'explicit-figure'],
  ])('link with valid %s target passes', async (_, path, identifier) => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref${path}#${identifier}`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(file.messages.length).toEqual(0);
    expect(link.url).toEqual('https://example.com/myst-ref/my-figure');
    expect(link.dataUrl).toEqual('https://example.com/myst-ref/my-figure.json');
    expect(link.type).toEqual('crossReference');
    expect((link as any).remote).toBe(true);
    expect((link as any).identifier).toEqual('explicit_figure');
    expect((link as any).label).toEqual('explicit_figure');
    expect((link as any).html_id).toEqual('explicit-figure');
  });
  test('link with no target does not match non-page reference', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: 'xref:myst-ref/my-figure',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test.each([
    ['and no path', ''],
    ['and slash-only path', '/'],
  ])('link with no target %s matches root', async (_, path) => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref${path}`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(file.messages.length).toEqual(0);
    expect(link.internal).toBe(false);
    expect(link.url).toEqual('https://example.com/myst-ref/');
    expect(link.dataUrl).toEqual('https://example.com/myst-ref/index.json');
    expect(link.type).toEqual('link');
  });
  test('link with no target and path matches page', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref/my-page`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(file.messages.length).toEqual(0);
    expect(link.internal).toBe(false);
    expect(link.url).toEqual('https://example.com/myst-ref/my-page');
    expect(link.dataUrl).toEqual('https://example.com/myst-ref/my-page.json');
    expect(link.type).toEqual('link');
  });
  test('link with page target as path fails', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref/my-page-id`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('link with page path as target fails', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref#/my-page`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('link with page identifier as target matches page', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref#my-page-id`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(file.messages.length).toEqual(0);
    expect(link.internal).toBe(false);
    expect(link.url).toEqual('https://example.com/myst-ref/my-page');
    expect(link.dataUrl).toEqual('https://example.com/myst-ref/my-page.json');
    expect(link.type).toEqual('link');
  });
  test('link with implicit root target and no path fails', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref#implicit-root-heading`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toEqual(1);
  });
  test('link with implicit root target and slash for path passes', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);
    const link: Link = {
      type: 'link',
      url: `xref:myst-ref/#implicit-root-heading`,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(file.messages.length).toEqual(0);
    expect(link.url).toEqual('https://example.com/myst-ref/');
    expect(link.dataUrl).toEqual('https://example.com/myst-ref/index.json');
    expect(link.type).toEqual('crossReference');
    expect((link as any).remote).toBe(true);
    expect((link as any).identifier).toEqual('implicit-root-heading');
    expect((link as any).label).toEqual('implicit-root-heading');
  });
});
