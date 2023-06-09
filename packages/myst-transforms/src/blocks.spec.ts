import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { VFile } from 'vfile';
import type { Root } from 'mdast';
import { blockMetadataTransform } from './blocks';

describe('Test blockMetadataTransform', () => {
  test('metadata is parsed and becomes data', async () => {
    const mdast = u('root', [
      u('block', { meta: '{"key": "value"}' }, [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
      ]),
    ]) as any;
    blockMetadataTransform(mdast as Root, new VFile());
    expect(mdast).toEqual(
      u('root', [
        u('block', { data: { key: 'value' } }, [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        ]),
      ]),
    );
  });
  test('metadata is parsed and is added to existing data', async () => {
    const mdast = u('root', [
      u('block', { data: { a: 'b' }, meta: '{"key": "value"}' }, [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
      ]),
    ]) as any;
    blockMetadataTransform(mdast as Root, new VFile());
    expect(mdast).toEqual(
      u('root', [
        u('block', { data: { a: 'b', key: 'value' } }, [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        ]),
      ]),
    );
  });
  test('label in data is lifted and normalized', async () => {
    const mdast = u('root', [
      u('block', { meta: '{"label": "My_Label", "key": "value"}' }, [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
      ]),
    ]) as any;
    blockMetadataTransform(mdast as Root, new VFile());
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            label: 'My_Label',
            identifier: 'my_label',
            html_id: 'my-label',
            data: { key: 'value' },
          },
          [u('paragraph', [u('text', 'We know what we are, but know not what we may be.')])],
        ),
      ]),
    );
  });
  test('label is propagated to code', async () => {
    const mdast = u('root', [
      u('block', { meta: '{"label": "My_Label", "key": "value"}' }, [
        u('code', 'We know what we are, but know not what we may be.'),
      ]),
    ]) as any;
    blockMetadataTransform(mdast as Root, new VFile());
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            label: 'My_Label',
            identifier: 'my_label',
            html_id: 'my-label',
            data: { key: 'value' },
          },
          [
            u(
              'code',
              { identifier: 'my_label-code' },
              'We know what we are, but know not what we may be.',
            ),
          ],
        ),
      ]),
    );
  });
  test('label is propagated to outputs', async () => {
    const mdast = u('root', [
      u('block', { meta: '{"label": "My_Label", "key": "value"}' }, [
        u('output', 'We know what we are'),
        u('output', 'but know not what we may be.'),
      ]),
    ]) as any;
    blockMetadataTransform(mdast as Root, new VFile());
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            label: 'My_Label',
            identifier: 'my_label',
            html_id: 'my-label',
            data: { key: 'value' },
          },
          [
            u('output', { identifier: 'my_label-output-0' }, 'We know what we are'),
            u('output', { identifier: 'my_label-output-1' }, 'but know not what we may be.'),
          ],
        ),
      ]),
    );
  });
});
