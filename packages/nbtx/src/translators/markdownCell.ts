import type { NotebookCell, Blocks, MarkdownCell } from '@curvenote/blocks';
import { CELL_TYPE, KINDS, TARGET, ContentFormatTypes, ensureString } from '@curvenote/blocks';

export function toJupyter(block: Blocks.Content): NotebookCell {
  const { metadata } = block;
  return {
    cell_type: CELL_TYPE.Markdown,
    metadata: {
      ...metadata.jupyter,
      iooxa: {
        id: block.id,
      },
    },
    source: block.content,
  } as MarkdownCell;
}

// QUESTION should returning content and caller adds the kind
export function fromJupyter(cell: MarkdownCell): Blocks.Content[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { iooxa, ...jupyter } = cell.metadata;
  return [
    {
      kind: KINDS.Content,
      targets: [TARGET.JupyterMarkdown],
      format: ContentFormatTypes.md,
      content: ensureString(cell.source) ?? '',
      metadata: {
        jupyter,
      },
    } as Blocks.Content,
  ];
}
