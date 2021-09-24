import { CELL_TYPE, RawCell } from './types';
import { fromJupyter, toJupyter } from './rawCell';
import { KINDS, TARGET, ContentFormatTypes } from '../blocks';
import { Content } from '../blocks/content';

describe('Raw block translators', () => {
  let jupyterRawCell: RawCell;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let iooxaContentBlock: Partial<Content>;

  beforeEach(() => {
    jupyterRawCell = {
      cell_type: CELL_TYPE.Raw,
      metadata: {
        collapsed: false,
        selected: true,
        something: 'unknown',
      },
      source: ['# Hello\n', '\n', 'World!\n', '\n'],
    };

    iooxaContentBlock = {
      id: {
        project: 'zxcvbn123456',
        block: 'qwerty98765',
        version: 2,
      },
      kind: KINDS.Content,
      targets: [TARGET.JupyterRaw],
      format: ContentFormatTypes.txt,
      content: '# Hello\n\nWorld!\n\n',
      metadata: {
        jupyter: {
          collapsed: false,
          selected: true,
          something: 'unknown',
        },
      },
    } as Partial<Content>;
  });

  it('Jupyter RawCell to toIooxa Content Block', () => {
    const blocks = fromJupyter(jupyterRawCell);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(
      expect.objectContaining({
        kind: KINDS.Content,
        targets: [TARGET.JupyterRaw],
        format: ContentFormatTypes.txt,
        content: '# Hello\n\nWorld!\n\n',
        metadata: {
          jupyter: {
            collapsed: false,
            selected: true,
            something: 'unknown',
          },
        },
      }),
    );
  });

  it('Iooxa Content Block to Jupyter RawCell ', () => {
    const cell = toJupyter(iooxaContentBlock as Content);
    expect(cell).toEqual(
      expect.objectContaining({
        cell_type: CELL_TYPE.Raw,
        metadata: {
          collapsed: false,
          selected: true,
          something: 'unknown',
          iooxa: {
            id: {
              project: 'zxcvbn123456',
              block: 'qwerty98765',
              version: 2,
            },
          },
        },
        source: '# Hello\n\nWorld!\n\n',
      }),
    );
  });
});
