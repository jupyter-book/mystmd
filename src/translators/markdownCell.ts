import { NotebookCell, MarkdownCell, CELL_TYPE } from './types';
import { KINDS, TARGET, ContentFormatTypes } from '../blocks';
import { Content } from '../blocks/content';
import { ensureString } from '../helpers';

export function toJupyter(block: Content): NotebookCell {
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
export function fromJupyter(cell: MarkdownCell): Content[] {
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
    } as Content,
  ];
}
