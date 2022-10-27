import type {
  Language,
  ALL_BLOCKS,
  Blocks,
  NotebookCell,
  JupyterNotebook,
  CellOutput,
} from '@curvenote/blocks';
import { KINDS, TARGET, CELL_TYPE } from '@curvenote/blocks';
import * as codeCell from './codeCell';
import * as markdownCell from './markdownCell';
import * as rawCell from './rawCell';
import * as notebook from './notebook';
import * as output from './outputData';

export * from './notebook';

// TODO complete typings - probably need generics of some form to solve this
export const translators: Record<
  CELL_TYPE,
  {
    toJupyter: (block: any) => NotebookCell;
    fromJupyter: (
      cell: any,
      language: Language | undefined,
    ) => (Blocks.Code | Blocks.Content | Blocks.Output)[];
  }
> = {
  [CELL_TYPE.Raw]: { ...rawCell },
  [CELL_TYPE.Markdown]: { ...markdownCell },
  [CELL_TYPE.Code]: { ...codeCell },
};

export function translateToJupyter(
  block: ALL_BLOCKS,
): JupyterNotebook | NotebookCell | CellOutput[] | null {
  switch (block.kind) {
    case KINDS.Notebook:
      return notebook.toJupyterNotebook(block as Blocks.Notebook);
    case KINDS.Content: {
      const targetSet = new Set(block.targets);
      if (targetSet.has(TARGET.JupyterMarkdown)) {
        return translators[CELL_TYPE.Markdown].toJupyter(block);
      }
      if (targetSet.has(TARGET.JupyterRaw)) {
        return translators[CELL_TYPE.Raw].toJupyter(block);
      }
      // Fallback is markdown
      return translators[CELL_TYPE.Markdown].toJupyter(block);
    }
    case KINDS.Code: {
      return translators[CELL_TYPE.Code].toJupyter(block);
    }
    case KINDS.Output: {
      return output.toJupyter(block);
    }
    default:
      return null;
  }
}

export function translateFromJupyter(
  cell: NotebookCell,
  language: Language | undefined,
): (Blocks.Code | Blocks.Content | Blocks.Output)[] {
  if (!translators[cell.cell_type]) {
    throw Error(`Unknown cell_type: ${cell.cell_type}`);
  }
  return translators[cell.cell_type].fromJupyter(cell, language);
}
