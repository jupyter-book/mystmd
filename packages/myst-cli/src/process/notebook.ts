import { computeHash } from 'myst-cli-utils';
import { NotebookCell, RuleId, fileWarn } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { nanoid } from 'nanoid';
import type { MinifiedOutput } from 'nbtx';
import type {
  IAttachments,
  ICell,
  IMimeBundle,
  INotebookContent,
  IOutput,
  MultilineString,
} from '@jupyterlab/nbformat';
import { CELL_TYPES, minifyCellOutput, ensureString } from 'nbtx';
import { VFile } from 'vfile';
import { logMessagesFromVFile } from '../utils/logMessagesFromVFile.js';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { BASE64_HEADER_SPLIT } from '../transforms/images.js';
import { parseMyst } from './myst.js';
import type { Code } from 'myst-spec-ext';
import type { PageFrontmatter } from 'myst-frontmatter';

function blockParent(cell: ICell, children: GenericNode[]) {
  const type = cell.cell_type === CELL_TYPES.code ? NotebookCell.code : NotebookCell.content;
  return { type: 'block', meta: JSON.stringify({ type, ...cell.metadata }), children };
}

/**
 *  mdast transform to move base64 cell attachments directly to image nodes
 *
 * The image transform subsequently handles writing this in-line base64 to file.
 */
function replaceAttachmentsTransform(
  session: ISession,
  mdast: GenericParent,
  attachments: IAttachments,
  file: string,
) {
  const vfile = new VFile();
  vfile.path = file;
  const imageNodes = selectAll('image', mdast);
  imageNodes.forEach((image: GenericNode) => {
    if (!image.url) return;
    const attachmentKey = (image.url as string).match(/^attachment:(.*)$/)?.[1];
    if (!attachmentKey) return;
    try {
      const attachment = Object.entries(attachments[attachmentKey] as IMimeBundle)[0];
      const mimeType = attachment[0];
      const attachmentVal = ensureString(attachment[1] as MultilineString);
      if (!attachmentVal) {
        fileWarn(vfile, `Unrecognized attachment name in ${file}: ${attachmentKey}`, {
          ruleId: RuleId.notebookAttachmentsResolve,
        });
      } else if (attachmentVal.includes(BASE64_HEADER_SPLIT)) {
        image.url = attachmentVal;
      } else {
        image.url = `data:${mimeType}${BASE64_HEADER_SPLIT}${attachmentVal}`;
      }
    } catch {
      fileWarn(vfile, `Unable to resolve attachment in ${file}: ${attachmentKey}`, {
        ruleId: RuleId.notebookAttachmentsResolve,
      });
    }
  });
  logMessagesFromVFile(session, vfile);
}

export async function processNotebook(
  session: ISession,
  file: string,
  content: string,
  opts?: { minifyMaxCharacters?: number },
): Promise<{ ast: GenericParent; frontmatter: PageFrontmatter }> {
  const { log } = session;
  const { metadata, cells } = JSON.parse(content) as INotebookContent;
  // notebook will be empty, use generateNotebookChildren, generateNotebookOrder here if we want to populate those

  const language = metadata?.kernelspec?.language ?? 'python';
  log.debug(`Processing Notebook: "${file}"`);

  const frontmatter = metadata.myst as PageFrontmatter;
  const cache = castSession(session);

  let end = cells.length;
  if (cells && cells.length > 1 && cells?.[cells.length - 1].source.length === 0) {
    end = -1;
  }

  const items = await cells?.slice(0, end).reduce(
    async (P, cell: ICell, index) => {
      const acc = await P;
      if (cell.cell_type === CELL_TYPES.markdown) {
        const cellContent = ensureString(cell.source);
        // If the first cell is a frontmatter block, do not put a block break above it
        const omitBlockDivider = index === 0 && cellContent.startsWith('---\n');
        const cellMdast = parseMyst(session, cellContent, file);
        if (cell.attachments) {
          replaceAttachmentsTransform(session, cellMdast, cell.attachments as IAttachments, file);
        }
        if (omitBlockDivider) {
          return acc.concat(...cellMdast.children);
        }
        return acc.concat(blockParent(cell, cellMdast.children));
      }
      if (cell.cell_type === CELL_TYPES.raw) {
        const raw: Code = {
          type: 'code',
          lang: '',
          value: ensureString(cell.source),
        };
        return acc.concat(blockParent(cell, [raw]));
      }
      if (cell.cell_type === CELL_TYPES.code) {
        const code: Code = {
          type: 'code',
          lang: language as string | undefined,
          executable: true,
          value: ensureString(cell.source),
        };

        const output: { type: 'output'; id: string; data: MinifiedOutput[] } = {
          type: 'output',
          id: nanoid(),
          data: [],
        };

        if (cell.outputs && (cell.outputs as IOutput[]).length > 0) {
          const minified: MinifiedOutput[] = await minifyCellOutput(
            cell.outputs as IOutput[],
            cache.$outputs,
            { computeHash, maxCharacters: opts?.minifyMaxCharacters },
          );
          output.data = minified;
        }
        return acc.concat(blockParent(cell, [code, output]));
      }
      return acc;
    },
    Promise.resolve([] as GenericNode[]),
  );

  return { ast: { type: 'root', children: items }, frontmatter };
}
