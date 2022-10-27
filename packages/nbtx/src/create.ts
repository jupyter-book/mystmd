import { Blocks, JupyterNotebook, KINDS, NotebookCell } from '@curvenote/blocks';
import { translateToJupyter } from './translators';

function isNotNull<T>(arg: T | null): arg is T {
  return arg != null;
}

export function blocksToIpynb(
  container: Blocks.Notebook,
  childBlocks: (Blocks.Content | Blocks.Code | Blocks.Output)[],
): JupyterNotebook {
  const notebook = translateToJupyter(container) as JupyterNotebook;
  const cells: NotebookCell[] = childBlocks
    .filter((child) => child.kind === KINDS.Content || child.kind === KINDS.Code)
    .map((child) => {
      if (child.kind === KINDS.Code) {
        return {} as NotebookCell; // TODO return (version as Code).toJupyterWithOutputs();
      }
      return translateToJupyter(child as Blocks.Content) as NotebookCell;
    });

  notebook.cells = cells.filter(isNotNull);

  return notebook;
}
