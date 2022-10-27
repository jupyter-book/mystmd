import type {
  BlockChild,
  BlockChildDict,
  ChildId,
  NotebookCodeBlockChild,
  BlockId,
  VersionId,
  JsonObject,
  JupyterNotebook,
  Blocks,
  IooxaMetadata,
} from '@curvenote/blocks';
import { KINDS, convertToSrcId } from '@curvenote/blocks';

/**
 * @param notebook a Notebook block from the DB
 */
export function toJupyterNotebook(notebook: Blocks.Notebook): JupyterNotebook {
  const { nbformat, nbformat_minor, ...metadata } = notebook.metadata;
  return {
    metadata: {
      ...metadata,
      iooxa: {
        id: notebook.id,
      },
    },
    nbformat,
    nbformat_minor,
    cells: [],
  };
}

export function notebookFromJupyter(data: JsonObject): Partial<Blocks.Notebook> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { iooxa, ...metadata } = data.metadata;
  return {
    kind: KINDS.Notebook,
    metadata: {
      ...metadata,
      nbformat: data.nbformat,
      nbformat_minor: data.nbformat_minor,
    },
    language: metadata.kernelspec?.language ?? '',
    order: [],
    children: {},
  } as Partial<Blocks.Notebook>;
}

export function generateChildId(
  notebookVersionId: VersionId | BlockId,
  cellVersionId: VersionId,
  idx: number,
): ChildId {
  return `${notebookVersionId.block}-${cellVersionId.block}-${idx}`;
}

export function generateNotebookOrder(
  notebookVersionId: VersionId | BlockId,
  items: IooxaMetadata[],
): ChildId[] {
  return items.map((item, idx) => generateChildId(notebookVersionId, item.id, idx));
}

export function generateNotebookChildren(
  notebookVersionId: VersionId | BlockId,
  items: IooxaMetadata[],
) {
  return items.reduce<BlockChildDict>((dict, item, idx) => {
    const childId = generateChildId(notebookVersionId, item.id, idx);
    if (item.outputId) {
      return {
        ...dict,
        [childId]: {
          id: childId,
          src: convertToSrcId(item.id),
          output: convertToSrcId(item.outputId),
        } as NotebookCodeBlockChild,
      };
    }
    return {
      ...dict,
      [childId]: {
        id: childId,
        src: convertToSrcId(item.id),
      } as BlockChild,
    };
  }, {});
}
