import {
  Blocks,
  CELL_TYPE,
  ContentFormatTypes,
  ensureString,
  KINDS,
  NotebookCell,
  RawCell,
  TARGET,
} from '@curvenote/blocks';

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
