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
    mdast.children[0].children.push({ type: 'output' });
  }
  return mdast;
}

describe('checkMetaTags', () => {
  it('filter tags', async () => {
    const tags = ['hide-cell', 'remove-input', 'tag-1', 'tag-2'];
    for (const filter of [true, false]) {
      const mdast = build_mdast(tags, true);
      checkMetaTags(new Session(), tags, filter);
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
      const tags = [];
      for (const target of ['cell', 'input', 'output']) {
        const tag = `${action}-${target}`;
        tags.push(tag);
        tags.push(tag);
      }
      const validMetatags = checkMetaTags(new Session(), tags, true);
      const expected = [];
      for (const target of ['cell', 'input', 'output']) {
        expected.push(`${action}-${target}`);
      }
      expect(validMetatags).toEqual(expected);
    }
  });
  it('validate tags with conflict', async () => {
    const tags = [];
    for (const action of ['hide', 'remove']) {
      for (const target of ['cell', 'input', 'output']) {
        tags.push(`${action}-${target}`);
      }
    }
    const validMetatags = checkMetaTags(new Session(), tags, true);
    const expected = [];
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
      const validMetatags = checkMetaTags(new Session(), tags, filter);
      const expected = [];
      for (const target of ['cell', 'input', 'output']) {
        expected.push(`remove-${target}`);
      }
      expect(validMetatags).toEqual(expected);
    }
  });
  it('duplicate tag warn', async () => {
    const session = new Session();
    const consoleSpy = jest.spyOn(session.log, 'warn');
    for (const action of ['hide', 'remove']) {
      for (const target of ['cell', 'input', 'output']) {
        const tag = `${action}-${target}`;
        const mdast = build_mdast([tag, tag], true);
        propagateBlockDataToCode(session, '', mdast);
        expect(consoleSpy).toHaveBeenCalledWith(`tag '${tag}' is duplicated`);
      }
    }
    consoleSpy.mockRestore();
  });
  it('tag conflict warn', async () => {
    const session = new Session();
    const consoleSpy = jest.spyOn(session.log, 'warn');
    for (const target of ['cell', 'input', 'output']) {
      const tags = [`hide-${target}`, `remove-${target}`];
      const mdast = build_mdast(tags, true);
      propagateBlockDataToCode(session, '', mdast);
      const message = `'hide-${target}' and 'remove-${target}' both exist`;
      expect(consoleSpy).toHaveBeenCalledWith(message);
    }
    consoleSpy.mockRestore();
  });
});

describe('propagateBlockDataToCode', () => {
  it('single tag propagation', async () => {
    for (const action of ['hide', 'remove']) {
      for (const target of ['cell', 'input', 'output']) {
        for (const has_output of [true, false]) {
          const tag = `${action}-${target}`;
          const mdast = build_mdast([tag], has_output);
          propagateBlockDataToCode(new Session(), '', mdast);
          let result = '';
          const outputNode = mdast.children[0].children[1];
          switch (target) {
            case 'cell':
              result = mdast.children[0].visibility;
              break;
            case 'input':
              result = mdast.children[0].children[0].visibility;
              break;
            case 'output':
              if (!has_output && target == 'output') {
                expect(outputNode).toEqual(undefined);
                continue;
              }
              result = outputNode.visibility;
              break;
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
        propagateBlockDataToCode(new Session(), '', mdast);
        const blockNode = mdast.children[0];
        const codeNode = mdast.children[0].children[0];
        const outputNode = mdast.children[0].children[1];
        expect(blockNode.visibility).toEqual(action);
        expect(codeNode.visibility).toEqual(action);
        if (has_output) {
          expect(outputNode.visibility).toEqual(action);
        } else {
          expect(outputNode).toEqual(undefined);
        }
      }
    }
  });
});
