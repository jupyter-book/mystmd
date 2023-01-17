import type { Root } from 'mdast';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'unist-util-select';
import { nanoid } from 'nanoid';
import type { MinifiedOutput } from 'nbtx';
import type { ICell, INotebookContent, IOutput } from '@jupyterlab/nbformat';
import { CELL_TYPES, minifyCellOutput } from 'nbtx';
import { castSession } from '../session';
import type { ISession } from '../session/types';
import { parseMyst } from './myst';

function asString(source?: string | string[]): string {
  return (Array.isArray(source) ? source.join('') : source) || '';
}

function createOutputDirective(): { myst: string; id: string } {
  const id = nanoid();
  return { myst: `\`\`\`{output}\n:id: ${id}\n\`\`\``, id };
}

export async function processNotebook(
  session: ISession,
  file: string,
  content: string,
): Promise<Root> {
  const { log } = session;
  const { metadata, cells } = JSON.parse(content) as INotebookContent;
  // notebook will be empty, use generateNotebookChildren, generateNotebookOrder here if we want to populate those

  const language = metadata?.kernelspec?.language ?? 'python';
  log.debug(`Processing Notebook: "${file}"`);

  const cache = castSession(session);

  const outputMap: Record<string, MinifiedOutput[]> = {};

  let end = cells.length;
  if (cells && cells.length > 1 && cells?.[cells.length - 1].source.length === 0) {
    end = -1;
  }

  const items = await cells?.slice(0, end).reduce(async (P, cell: ICell) => {
    const acc = await P;
    if (cell.cell_type === CELL_TYPES.markdown) {
      return acc.concat(asString(cell.source));
    }
    if (cell.cell_type === CELL_TYPES.raw) {
      return acc.concat(`\`\`\`\n${asString(cell.source)}\n\`\`\``);
    }
    if (cell.cell_type === CELL_TYPES.code) {
      const code = `\`\`\`${language}\n${asString(cell.source)}\n\`\`\``;
      if (cell.outputs && (cell.outputs as IOutput[]).length > 0) {
        const minified: MinifiedOutput[] = await minifyCellOutput(
          cell.outputs as IOutput[],
          cache.$outputs,
        );
        const { myst, id } = createOutputDirective();
        outputMap[id] = minified;

        return acc.concat(code).concat([myst]);
      }
      return acc.concat(code);
    }
    return acc;
  }, Promise.resolve([] as string[]));

  const mdast = parseMyst(items.join('\n\n+++\n\n'));

  selectAll('output', mdast).forEach((output: GenericNode) => {
    output.data = outputMap[output.id];
  });

  return mdast;
}
