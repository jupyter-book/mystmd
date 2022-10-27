import type { Blocks, NotebookCell, RawCell } from '@curvenote/blocks';
import { CELL_TYPE, ContentFormatTypes, ensureString, KINDS, TARGET } from '@curvenote/blocks';

export function toJupyter(block: Blocks.Content): NotebookCell {
  const { metadata } = block;

  return {
    cell_type: CELL_TYPE.Raw,
    metadata: {
      ...metadata.jupyter,
      iooxa: {
        id: block.id,
      },
    },
    source: block.content,
  } as RawCell;
}

// QUESTION should returning content and caller adds the kind
export function fromJupyter(cell: RawCell): Blocks.Content[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { iooxa, ...jupyter } = cell.metadata;
  return [
    {
      kind: KINDS.Content,
      targets: [TARGET.JupyterRaw],
      format: ContentFormatTypes.txt,
      content: ensureString(cell.source) ?? '',
      metadata: {
        jupyter,
      },
    } as Blocks.Content,
  ];
}
