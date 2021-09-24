import { MarkdownCell, CELL_TYPE } from './types';
import { fromJupyter, toJupyter } from './markdownCell';
import { KINDS, TARGET, ContentFormatTypes } from '../blocks';
import { Content } from '../blocks/content';

describe('Markdown block translators', () => {
  let jupyterMarkdownCell: MarkdownCell;
  let ourMarkdownContent: Partial<Content>;

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
    } as Partial<Content>;
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
    const cell = toJupyter(ourMarkdownContent as Content);

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
