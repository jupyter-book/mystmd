import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link } from 'myst-spec-ext';
import type { ResolvedExternalReference } from './types';
import { MystTransformer } from './myst';
import { linksTransform } from './plugin';

export const TEST_REFERENCES: ResolvedExternalReference[] = [
  {
    key: 'myst-ref',
    url: 'https://example.com/myst-ref',
    kind: 'myst',
    value: {
      version: '1',
      myst: '1.2.0',
      references: [
        {
          identifier: 'explicit-figure',
          kind: 'figure',
          data: '/my-figure.json',
          url: '/my-figure',
        },
      ],
    },
  },
];

describe('Link Plugin Transformer', () => {
  test('link text is matched', async () => {
    const file = new VFile();
    const t = new MystTransformer(TEST_REFERENCES);

    const link: Link = {
      type: 'link',
      url: `xref:myst-ref#explicit-figure`,
      children: [{ type: 'text', value: 'xref:myst-ref#explicit-figure' }],
    };
    linksTransform({ type: 'root', children: [link] }, file, { transformers: [t] });
    expect(file.messages.length).toEqual(0);
    expect(link.url).toEqual('/my-figure');
    expect(link.dataUrl).toEqual('/my-figure.json');
    expect(link.type).toEqual('crossReference');
    expect((link as any).remoteBaseUrl).toEqual('https://example.com/myst-ref');
    expect((link as any).remote).toBe(true);
    expect((link as any).identifier).toEqual('explicit-figure');
    expect((link as any).label).toEqual('explicit-figure');
    expect(link.children).toEqual([]);
  });
});
