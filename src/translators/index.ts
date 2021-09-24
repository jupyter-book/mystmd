import { KINDS, Language, ALL_BLOCKS, Blocks, TARGET } from '../blocks';
import { NotebookCell, CELL_TYPE, CellOutput, JupyterNotebook } from './types';
import * as codeCell from './codeCell';
import * as markdownCell from './markdownCell';
import * as rawCell from './rawCell';
import * as notebook from './notebook';
import * as output from './outputData';
import { Code } from '../blocks/code';
import { Output } from '../blocks/output';
import { Content } from '../blocks/content';

export * from './types';
export * from './notebook';

// TODO complete typings - probably need generics of some form to solve this
export const translators: Record<
  CELL_TYPE,
  {
    toJupyter: (block: any) => NotebookCell;
    fromJupyter: (cell: any, language: Language | undefined) => (Code | Content | Output)[];
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
  }
  return null;
}

export function translateFromJupyter(
  cell: NotebookCell,
  language: Language | undefined,
): (Code | Content | Output)[] {
  return translators[cell.cell_type].fromJupyter(cell, language);
}
