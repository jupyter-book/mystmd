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

describe('Test blockMetadataTransform notebook cell ids', () => {
  test('a code cell gets a stable anchor equal to its nbformat id', async () => {
    const mdast = u('root', [
      u('block', { kind: 'notebook-code', data: { _jupyterCellId: '9bd1512c-9ca1-4695' } }, [
        u('code', 'points'),
        u('outputs', [u('output', 'a'), u('output', 'b')]),
      ]),
    ]) as any;
    blockMetadataTransform(mdast, new VFile());
    const block = mdast.children[0];
    // html_id is verbatim so a copied deep link equals the nbformat cell id
    expect(block.html_id).toBe('9bd1512c-9ca1-4695');
    // identifier is normalized so [](#id) resolves like a label
    expect(block.identifier).toBe('9bd1512c-9ca1-4695');
    // not registered as a named "label"; internal stash is removed
    expect(block.label).toBeUndefined();
    expect(block.data).toBeUndefined();
    // multi-output: anchor the cell only — no per-output ids fabricated
    const outputs = block.children[1];
    expect(outputs.identifier).toBeUndefined();
    expect(outputs.children.every((o: any) => o.identifier === undefined)).toBe(true);
    expect(block.children[0].identifier).toBeUndefined();
  });
  test('the anchor is unchanged across two runs of the same source', async () => {
    const build = () => {
      const mdast = u('root', [
        u('block', { kind: 'notebook-code', data: { _jupyterCellId: 'abc-123' } }, [
          u('code', 'x = 1'),
        ]),
      ]) as any;
      blockMetadataTransform(mdast, new VFile());
      return mdast.children[0].html_id;
    };
    expect(build()).toBe('abc-123');
    expect(build()).toBe(build());
  });
  test('an unlabeled markdown cell without an id gets no anchor', async () => {
    const mdast = u('root', [
      u('block', { kind: 'notebook-content', data: {} }, [u('paragraph', [u('text', 'hello')])]),
    ]) as any;
    blockMetadataTransform(mdast, new VFile());
    const block = mdast.children[0];
    expect(block.identifier).toBeUndefined();
    expect(block.html_id).toBeUndefined();
  });
  test('an author label wins over the auto cell id', async () => {
    const mdast = u('root', [
      u(
        'block',
        { kind: 'notebook-code', data: { label: 'My_Label', _jupyterCellId: 'abc-123' } },
        [u('code', 'x = 1'), u('outputs', [u('output', 'a')])],
      ),
    ]) as any;
    blockMetadataTransform(mdast, new VFile());
    const block = mdast.children[0];
    expect(block.identifier).toBe('my_label');
    expect(block.label).toBe('My_Label');
    expect(block.html_id).toBe('my-label');
    // explicit labels keep propagating to input/outputs (unchanged behavior)
    expect(block.children[0].identifier).toBe('my_label-code');
    expect(block.children[1].identifier).toBe('my_label-outputs');
    expect(block.children[1].children[0].identifier).toBe('my_label-outputs-0');
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
