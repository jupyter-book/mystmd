import { Session } from '../session';
import { liftCodeMetadataToBlock, metadataFromCode, propagateBlockDataToCode } from './code';

describe('metadataFromCode', () => {
  it('empty code returns self', async () => {
    const value = '';
    expect(metadataFromCode(new Session(), '', value)).toEqual({ value });
  });
  it('normal code returns self', async () => {
    const value = 'a = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), '', value)).toEqual({ value });
  });
  it('starting newlines are persisted without metadata', async () => {
    const value = '\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), '', value)).toEqual({ value });
  });
  it('starting comments are persisted', async () => {
    const value = '\n# comment\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), '', value)).toEqual({ value });
  });
  it('basic metadata is parsed', async () => {
    const value = '#| key: value\n#| flag: true\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), '', value)).toEqual({
      value,
      metadata: { key: 'value', flag: true },
    });
  });
  it('whitespace is ignored around metadata', async () => {
    const value = '\n\n#| key: value\n\n#| flag: true\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), '', value)).toEqual({
      value,
      metadata: { key: 'value', flag: true },
    });
  });
  it('whitespace is removed around metadata', async () => {
    const value = '\n\n#| key: value\n\n#| flag: true\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), '', value, { remove: true })).toEqual({
      value: 'a = 5 + 5\nprint(a)',
      metadata: { key: 'value', flag: true },
    });
  });
  it('invalid metadata is passed and not removed', async () => {
    const value = '\n\n#| invalid\n\n#|   yaml...:\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), '', value, { remove: true })).toEqual({
      value,
    });
  });
});

describe('liftCodeMetadataToBlock', () => {
  it('no code metadata', async () => {
    const mdast: any = {
      type: 'root',
      children: [
        {
          type: 'block',
          data: { key: 'value' },
          children: [
            {
              type: 'code',
              value: 'print("hello world")',
            },
          ],
        },
      ],
    };
    liftCodeMetadataToBlock(new Session(), '', mdast);
    expect(mdast.children[0].data).toEqual({ key: 'value' });
    expect(mdast.children[0].children[0].value).toEqual('print("hello world")');
  });
  it('metadata moved to block data', async () => {
    const mdast: any = {
      type: 'root',
      children: [
        {
          type: 'block',
          data: { key: 'value' },
          children: [
            {
              type: 'code',
              value: '#| label: codeBlock\nprint("hello world")',
            },
          ],
        },
      ],
    };
    liftCodeMetadataToBlock(new Session(), '', mdast);
    expect(mdast.children[0].data).toEqual({ key: 'value', label: 'codeBlock' });
    expect(mdast.children[0].children[0].value).toEqual('print("hello world")');
  });
  it('multiple metadata, first moved to block, other ignored', async () => {
    const mdast: any = {
      type: 'root',
      children: [
        {
          type: 'block',
          data: { key: 'value' },
          children: [
            {
              type: 'code',
              value: '#| label: codeBlock\nprint("hello world")',
            },
            {
              type: 'code',
              value: '#| label: another\nprint("hello world2")',
            },
          ],
        },
      ],
    };
    liftCodeMetadataToBlock(new Session(), '', mdast);
    expect(mdast.children[0].data).toEqual({ key: 'value', label: 'codeBlock' });
    expect(mdast.children[0].children[0].value).toEqual('print("hello world")');
    expect(mdast.children[0].children[1].value).toEqual('print("hello world2")');
  });
});

function build_mdast_by_tags(tags: string[]) {
  const mdast: any = {
    type: 'root',
    children: [
      {
        type: 'block',
        children: [
          {
            type: 'code',
          },
          {
            type: 'output',
          },
        ],
        data: {
          tags: tags,
        },
      },
    ],
  };
  return mdast;
}

describe('propagateBlockDataToCode', () => {
  it('single tag propagation', async () => {
    for (const action of ['hide', 'remove']) {
      for (const target of ['cell', 'input', 'output']) {
        const tag = `${action}-${target}`;
        const mdast = build_mdast_by_tags([tag]);
        propagateBlockDataToCode(new Session(), '', mdast);
        let result = '';
        switch (target) {
          case 'cell':
            result = mdast.children[0].visibility;
            break;
          case 'input':
            result = mdast.children[0].children[0].visibility;
            break;
          case 'output':
            result = mdast.children[0].children[1].visibility;
            break;
        }
        expect(result).toEqual(action);
      }
    }
  });
  it('multi tags propagation', async () => {
    for (const action of [`hide`, `remove`]) {
      const tags = [`${action}-cell`, `${action}-input`, `${action}-output`];
      const mdast = build_mdast_by_tags(tags);
      propagateBlockDataToCode(new Session(), '', mdast);
      for (const node of [
        mdast.children[0],
        mdast.children[0].children[0],
        mdast.children[0].children[1],
      ]) {
        expect(node.visibility).toEqual(action);
      }
    }
  });
});
