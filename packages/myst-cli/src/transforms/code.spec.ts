import { describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
import { Session } from '../session';
import {
  liftCodeMetadataToBlock,
  metadataFromCode,
  propagateBlockDataToCode,
  checkMetaTags,
} from './code';

describe('metadataFromCode', () => {
  it('empty code returns self', async () => {
    const value = '';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({ value });
  });
  it('normal code returns self', async () => {
    const value = 'a = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({ value });
  });
  it('starting newlines are persisted without metadata', async () => {
    const value = '\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({ value });
  });
  it('starting comments are persisted', async () => {
    const value = '\n# comment\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({ value });
  });
  it('basic metadata is parsed', async () => {
    const value = '#| key: value\n#| flag: true\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({
      value,
      metadata: { key: 'value', flag: true },
    });
  });
  it('basic metadata with SPACE between `#` and `|` is parsed', async () => {
    const value = '# | key: value\n# | flag: true\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({
      value,
      metadata: { key: 'value', flag: true },
    });
  });
  it('whitespace is ignored around metadata', async () => {
    const value = '\n\n#| key: value\n\n#| flag: true\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({
      value,
      metadata: { key: 'value', flag: true },
    });
  });
  it('whitespace is removed around metadata', async () => {
    const value = '\n\n#| key: value\n\n#| flag: true\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value, { remove: true })).toEqual({
      value: 'a = 5 + 5\nprint(a)',
      metadata: { key: 'value', flag: true },
    });
  });
  it('invalid metadata is passed and not removed', async () => {
    const value = '\n\n#| invalid\n\n#|   yaml...:\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value, { remove: true })).toEqual({
      value,
    });
  });
  it('allows for a cell-magic to come first', async () => {
    const value = '%%time\n#| key: value\n\n#| flag: true\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({
      value,
      metadata: { key: 'value', flag: true },
    });
  });
  it('allows for a cell-magic to come first, but not in the middle', async () => {
    const value = '\n\n%%time\n#| key: value\n%%time\n#| flag: true\n\n\na = 5 + 5\nprint(a)';
    expect(metadataFromCode(new Session(), new VFile(''), value)).toEqual({
      value,
      metadata: { key: 'value' },
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
    liftCodeMetadataToBlock(new Session(), new VFile(''), mdast);
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
    liftCodeMetadataToBlock(new Session(), new VFile(''), mdast);
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
    liftCodeMetadataToBlock(new Session(), new VFile(''), mdast);
    expect(mdast.children[0].data).toEqual({ key: 'value', label: 'codeBlock' });
    expect(mdast.children[0].children[0].value).toEqual('print("hello world")');
    expect(mdast.children[0].children[1].value).toEqual('print("hello world2")');
  });
});

function build_mdast(tags: string[], has_output: boolean) {
  const mdast: any = {
    type: 'root',
    children: [
      {
        type: 'block',
        children: [
          {
            type: 'code',
            executable: true,
          },
        ],
        data: {
          tags: tags,
        },
      },
    ],
  };
  if (has_output) {
    mdast.children[0].children.push({
      type: 'outputs',
      children: [{ type: 'output', children: [] }],
    });
  }
  return mdast;
}

describe('checkMetaTags', () => {
  it('filter tags', async () => {
    const tags = ['hide-cell', 'remove-input', 'tag-1', 'tag-2'];
    for (const filter of [true, false]) {
      const mdast = build_mdast(tags, true);
      const vfile = new VFile();
      checkMetaTags(vfile, {} as any, tags, filter);
      const result = mdast.children[0].data.tags;
      if (filter) {
        expect(result).toEqual(['tag-1', 'tag-2']);
      } else {
        expect(result).toEqual(tags);
      }
    }
  });
  it('validate tags with duplicate', async () => {
    for (const action of ['hide', 'remove']) {
      const tags: string[] = [];
      for (const target of ['cell', 'input', 'output']) {
        const tag = `${action}-${target}`;
        tags.push(tag);
        tags.push(tag);
      }
      const validMetatags = checkMetaTags(new VFile(), {} as any, tags, true);
      const expected: string[] = [];
      for (const target of ['cell', 'input', 'output']) {
        expected.push(`${action}-${target}`);
      }
      expect(validMetatags).toEqual(expected);
    }
  });
  it('validate tags with conflict', async () => {
    const tags: string[] = [];
    for (const action of ['hide', 'remove']) {
      for (const target of ['cell', 'input', 'output']) {
        tags.push(`${action}-${target}`);
      }
    }
    const validMetatags = checkMetaTags(new VFile(), {} as any, tags, true);
    const expected: string[] = [];
    for (const target of ['cell', 'input', 'output']) {
      expected.push(`remove-${target}`);
    }
    expect(validMetatags).toEqual(expected);
  });
  it('validate tags with duplicate, conflict and filter', async () => {
    for (const filter of [true, false]) {
      const tags = ['tag-1', 'tag-2'];
      for (const action of ['hide', 'remove']) {
        for (const target of ['cell', 'input', 'output']) {
          tags.push(`${action}-${target}`);
          tags.push(`${action}-${target}`);
        }
      }
      const validMetatags = checkMetaTags(new VFile(), {} as any, tags, filter);
      const expected: string[] = [];
      for (const target of ['cell', 'input', 'output']) {
        expected.push(`remove-${target}`);
      }
      expect(validMetatags).toEqual(expected);
    }
  });
  it('duplicate tag warn', async () => {
    for (const action of ['hide', 'remove']) {
      for (const target of ['cell', 'input', 'output']) {
        const tag = `${action}-${target}`;
        const mdast = build_mdast([tag, tag], true);
        const vfile = new VFile();
        propagateBlockDataToCode(new Session(), vfile, mdast);
        expect(vfile.messages[0].message).toBe(`tag '${tag}' is duplicated`);
      }
    }
  });
  it('tag conflict warn', async () => {
    for (const target of ['cell', 'input', 'output']) {
      const tags = [`hide-${target}`, `remove-${target}`];
      const mdast = build_mdast(tags, true);
      const vfile = new VFile();
      propagateBlockDataToCode(new Session(), vfile, mdast);
      const message = `'hide-${target}' and 'remove-${target}' both exist`;
      expect(vfile.messages[0].message).toBe(message);
    }
  });
});

describe('propagateBlockDataToCode', () => {
  it('single tag propagation', async () => {
    for (const action of ['hide', 'remove']) {
      for (const target of ['cell', 'input', 'output']) {
        for (const has_output of [true, false]) {
          const tag = `${action}-${target}`;
          const mdast = build_mdast([tag], has_output);
          propagateBlockDataToCode(new Session(), new VFile(), mdast);
          let result = '';
          const outputsNode = mdast.children[0].children[1];
          switch (target) {
            case 'cell':
              result = mdast.children[0].visibility;
              break;
            case 'input':
              result = mdast.children[0].children[0].visibility;
              break;
            case 'output':
              if (!has_output) {
                expect(outputsNode).toEqual(undefined);
                continue;
              }
              result = outputsNode.visibility;
              break;
            default:
              throw new Error();
          }
          expect(result).toEqual(action);
        }
      }
    }
  });
  it('multi tags propagation', async () => {
    for (const action of [`hide`, `remove`]) {
      for (const has_output of [true, false]) {
        const tags = [`${action}-cell`, `${action}-input`, `${action}-output`];
        const mdast = build_mdast(tags, has_output);
        propagateBlockDataToCode(new Session(), new VFile(), mdast);
        const blockNode = mdast.children[0];
        const codeNode = mdast.children[0].children[0];
        const outputsNode = mdast.children[0].children[1];
        expect(blockNode.visibility).toEqual(action);
        expect(codeNode.visibility).toEqual(action);
        if (has_output) {
          expect(outputsNode.visibility).toEqual(action);
        } else {
          expect(outputsNode).toEqual(undefined);
        }
      }
    }
  });
  it('placeholder creates image node child of outputs', async () => {
    const mdast: any = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'code',
              executable: true,
            },
            {
              type: 'outputs',
              children: [],
            },
          ],
          data: {
            placeholder: 'placeholder.png',
          },
        },
      ],
    };
    propagateBlockDataToCode(new Session(), new VFile(), mdast);
    const outputsNode = mdast.children[0].children[1];
    expect(outputsNode.children?.length).toEqual(1);
    expect(outputsNode.children[0].type).toEqual('image');
    expect(outputsNode.children[0].placeholder).toBeTruthy();
  });
  it('placeholder passes with no outputs', async () => {
    const mdast: any = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'code',
              executable: true,
            },
          ],
          data: {
            placeholder: 'placeholder.png',
          },
        },
      ],
    };
    propagateBlockDataToCode(new Session(), new VFile(), mdast);
    expect(mdast.children.length).toEqual(1);
    expect(mdast.children[0].children.length).toEqual(1);
  });
});
