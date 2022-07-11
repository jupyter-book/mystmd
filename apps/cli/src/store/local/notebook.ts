import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import { nanoid } from 'nanoid';
import { CellOutput, ContentFormatTypes, KINDS } from '@curvenote/blocks';
import {
  parseNotebook,
  TranslatedBlockPair,
  minifyCellOutput,
  MinifiedOutput,
} from '@curvenote/nbtx';
import { parseMyst, Root } from '../../myst';
import { ISession } from '../../session/types';
import { publicPath } from '../../utils';
import { createWebFileObjectFactory } from '../../web/files';

function asString(source?: string | string[]): string {
  return (Array.isArray(source) ? source.join('') : source) || '';
}

function createOutputDirective(): { myst: string; id: string } {
  const id = nanoid();
  return { myst: `\`\`\`{output}\n:id: ${id}\n\`\`\``, id };
}

export async function processNotebook(
  session: ISession,
  path: string,
  content: string,
): Promise<Root> {
  const { log } = session;
  const { notebook, children } = parseNotebook(JSON.parse(content));
  // notebook will be empty, use generateNotebookChildren, generateNotebookOrder here if we want to populate those

  const language = notebook.language ?? notebook.metadata?.kernelspec.language ?? 'python';
  log.debug(`Processing Notebook: "${path}"`);

  const fileFactory = createWebFileObjectFactory(log, publicPath(session), '_static', {
    useHash: true,
  });

  const outputMap: Record<string, MinifiedOutput[]> = {};

  let end = children.length;
  if (
    children &&
    children.length > 1 &&
    children?.[children.length - 1].content.content.length === 0
  )
    end = -1;

  const items = await children?.slice(0, end).reduce(async (P, item: TranslatedBlockPair) => {
    const acc = await P;
    if (item.content.kind === KINDS.Content) {
      if (item.content.format === ContentFormatTypes.md)
        return acc.concat(asString(item.content.content));
      if (item.content.format === ContentFormatTypes.txt)
        return acc.concat(`\`\`\`\n${asString(item.content.content)}\n\`\`\``);
    }
    if (item.content.kind === KINDS.Code) {
      const code = `\`\`\`${language}\n${asString(item.content.content)}\n\`\`\``;
      if (item.output && item.output.original) {
        const minified: MinifiedOutput[] = await minifyCellOutput(
          fileFactory,
          item.output.original as CellOutput[],
          { basepath: '' }, // fileFactory takes care of this
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
