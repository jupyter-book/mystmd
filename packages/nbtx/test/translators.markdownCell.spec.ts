import {
  MarkdownCell,
  CELL_TYPE,
  KINDS,
  TARGET,
  ContentFormatTypes,
  Blocks,
} from '@curvenote/blocks';
import { fromJupyter, toJupyter } from '../src/translators/markdownCell';

describe('translators.markdownCell', () => {
  let jupyterMarkdownCell: MarkdownCell;
  let ourMarkdownContent: Partial<Blocks.Content>;

  beforeEach(() => {
    jupyterMarkdownCell = {
      cell_type: CELL_TYPE.Markdown,
      metadata: {
        collapsed: false,
        selected: true,
        something: 'unknown',
      },
      source: ['# Hello\n', '\n', 'World!\n', '\n'],
    };

    ourMarkdownContent = {
      id: {
        project: 'ABCDEF1234567',
        block: 'QWERTYUI098765',
        version: 2,
      },
      kind: KINDS.Content,
      targets: [TARGET.JupyterMarkdown],
      format: ContentFormatTypes.md,
      content: '# Hello\n\nWorld!\n\n',
      metadata: {
        jupyter: {
          collapsed: false,
          selected: true,
          something: 'unknown',
        },
      },
    } as Partial<Blocks.Content>;
  });

  it('plain Jupyter MarkdownCell => to our Content Block', () => {
    const blocks = fromJupyter(jupyterMarkdownCell);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(
      expect.objectContaining({
        kind: KINDS.Content,
        targets: [TARGET.JupyterMarkdown],
        format: ContentFormatTypes.md,
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

  it('Our Content Block => Jupyter MarkdownCell', () => {
    const cell = toJupyter(ourMarkdownContent as Blocks.Content);

    expect(cell).toEqual(
      expect.objectContaining({
        cell_type: CELL_TYPE.Markdown,
        metadata: {
          collapsed: false,
          selected: true,
          something: 'unknown',
          iooxa: {
            id: {
              project: 'ABCDEF1234567',
              block: 'QWERTYUI098765',
              version: 2,
            },
          },
        },
        source: '# Hello\n\nWorld!\n\n',
      }),
    );
  });
});
