import { Blocks, JupyterNotebook } from '@curvenote/blocks';
import { notebookFromJupyter, translateFromJupyter } from './translators';
import { TranslatedBlockPair } from './types';

/**
 * Parses the notebook Json creating a draft/empty notebook block and an array of
 * translated block versions ready for ready for....
 */
export const parseNotebook = (
  notebookAsJson: JupyterNotebook,
): {
  notebook: Partial<Blocks.Notebook>;
  children: TranslatedBlockPair[];
} => {
  const children: TranslatedBlockPair[] = notebookAsJson.cells.map((cell) => {
    const [content, output] = translateFromJupyter(
      cell,
      notebookAsJson?.metadata?.language_info?.name,
    );
    if (!output || (output as Blocks.Output)?.original?.length === 0) {
      return { content } as TranslatedBlockPair;
    }
    return { content, output } as TranslatedBlockPair;
  });

  const notebook = notebookFromJupyter(notebookAsJson);

  return { notebook, children };
};
