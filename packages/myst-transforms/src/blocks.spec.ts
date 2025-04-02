import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { VFile } from 'vfile';
import { blockMetadataTransform, blockNestingTransform, blockToFigureTransform } from './blocks';

describe('Test blockMetadataTransform', () => {
  test.each([
    [
      ['a', 'block', 'b'],
      ['block>a', 'block', 'block>b'],
    ],
    [
      ['block', 'b'],
      ['block', 'block>b'],
    ],
    [['a', 'b'], ['block>a,b']],
    [
      ['block', 'block'],
      ['block', 'block'],
    ],
    [
      ['a', 'block', 'b', 'c'],
      ['block>a', 'block', 'block>b,c'],
    ],
  ])('nestBlock(%s, %s)}', (a, b) => {
    const mdast = u(
      'root',
      a.map((type) => ({ type })),
    ) as any;
    blockNestingTransform(mdast);
    expect(
      mdast.children.map(
        ({ type, children }) =>
          `${type}${
            children && children.length > 0 ? '>' + children.map(({ type: t }) => t).join(',') : ''
          }`,
      ),
    ).toEqual(b);
  });
  test('metadata is parsed and becomes data', async () => {
    const mdast = u('root', [
      u('block', { meta: '{"key": "value"}' }, [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
      ]),
    ]) as any;
    blockMetadataTransform(mdast, new VFile());
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
    blockMetadataTransform(mdast, new VFile());
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
    blockMetadataTransform(mdast, new VFile());
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
    blockMetadataTransform(mdast, new VFile());
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
        u('outputs', [
          u('output', 'We know what we are'),
          u('output', 'but know not what we may be.'),
        ]),
      ]),
    ]) as any;
    blockMetadataTransform(mdast, new VFile());
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
            u('outputs', { identifier: 'my_label-outputs' }, [
              u('output', { identifier: 'my_label-outputs-0' }, 'We know what we are'),
              u('output', { identifier: 'my_label-outputs-1' }, 'but know not what we may be.'),
            ]),
          ],
        ),
      ]),
    );
  });
});

describe('Test blockToFigureTransform', () => {
  test('block metadata is propagated to new figure', async () => {
    const mdast = u('root', [
      u(
        'block',
        {
          label: 'my-label',
          identifier: 'my-label',
          data: { caption: 'My caption', metadata: '' },
          attribute: '',
        },
        [u('paragraph', [u('text', 'value')])],
      ),
    ]) as any;
    blockToFigureTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            data: { metadata: '' },
            attribute: '',
          },
          [
            u('container', { kind: 'figure', label: 'my-label', identifier: 'my-label' }, [
              u('paragraph', [u('text', 'My caption')]),
              u('paragraph', [u('text', 'value')]),
            ]),
          ],
        ),
      ]),
    );
  });
  test('fig-cap coerces to caption for block-to-figure', async () => {
    const mdast = u('root', [
      u(
        'block',
        {
          label: 'my-label',
          identifier: 'my-label',
          data: { 'fig-cap': 'My caption', metadata: '' },
          attribute: '',
        },
        [u('paragraph', [u('text', 'value')])],
      ),
    ]) as any;
    blockToFigureTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            data: { metadata: '' },
            attribute: '',
          },
          [
            u('container', { kind: 'figure', label: 'my-label', identifier: 'my-label' }, [
              u('paragraph', [u('text', 'My caption')]),
              u('paragraph', [u('text', 'value')]),
            ]),
          ],
        ),
      ]),
    );
  });
  test('tbl-cap coerces to caption for block-to-figure', async () => {
    const mdast = u('root', [
      u(
        'block',
        {
          label: 'my-label',
          identifier: 'my-label',
          data: { 'tbl-cap': 'My caption', metadata: '' },
          attribute: '',
        },
        [u('paragraph', [u('text', 'value')])],
      ),
    ]) as any;
    blockToFigureTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            data: { metadata: '' },
            attribute: '',
          },
          [
            u('container', { kind: 'table', label: 'my-label', identifier: 'my-label' }, [
              u('paragraph', [u('text', 'My caption')]),
              u('paragraph', [u('text', 'value')]),
            ]),
          ],
        ),
      ]),
    );
  });
  test('block kind is applied to figure block-to-figure', async () => {
    const mdast = u('root', [
      u(
        'block',
        {
          label: 'my-label',
          identifier: 'my-label',
          data: { 'fig-cap': 'My caption', metadata: '', kind: 'table' },
          attribute: '',
        },
        [u('paragraph', [u('text', 'value')])],
      ),
    ]) as any;
    blockToFigureTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            data: { metadata: '' },
            attribute: '',
          },
          [
            u('container', { kind: 'table', label: 'my-label', identifier: 'my-label' }, [
              u('paragraph', [u('text', 'My caption')]),
              u('paragraph', [u('text', 'value')]),
            ]),
          ],
        ),
      ]),
    );
  });
  test('block data type notebook-cell results in noSubcontainers', async () => {
    const mdast = u('root', [
      u(
        'block',
        {
          kind: 'notebook-code',
          label: 'my-label',
          identifier: 'my-label',
          data: { 'fig-cap': 'My caption', metadata: '' },
          attribute: '',
        },
        [u('paragraph', [u('text', 'value')])],
      ),
    ]) as any;
    blockToFigureTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u(
          'block',
          {
            kind: 'notebook-code',
            data: { metadata: '' },
            attribute: '',
          },
          [
            u(
              'container',
              { kind: 'figure', label: 'my-label', identifier: 'my-label', noSubcontainers: true },
              [u('paragraph', [u('text', 'My caption')]), u('paragraph', [u('text', 'value')])],
            ),
          ],
        ),
      ]),
    );
  });
});
