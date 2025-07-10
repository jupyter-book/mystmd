import path from 'node:path';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { FRONTMATTER_ALIASES, PAGE_FRONTMATTER_KEYS } from 'myst-frontmatter';
import { writeIpynb } from 'myst-to-ipynb';
import { filterKeys } from 'simple-validators';
import { VFile } from 'vfile';
import { finalizeMdast } from '../../process/mdast.js';
import type { ISession } from '../../session/types.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { KNOWN_IMAGE_EXTENSIONS } from '../../utils/resolveExtension.js';
import type { ExportWithOutput, ExportFnOptions } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { getFileContent } from '../utils/getFileContent.js';

export async function runIpynbExport(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
) {
  const toc = tic();
  const { output, articles } = exportOptions;
  const { clean, projectPath, extraLinkTransformers, execute } = opts ?? {};
  // At this point, export options are resolved to contain one-and-only-one article
  const article = articles[0];
  if (!article?.file) return { tempFolders: [] };
  if (clean) cleanOutput(session, output);
  const [{ mdast, frontmatter }] = await getFileContent(session, [article.file], {
    projectPath,
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    extraLinkTransformers,
    preFrontmatters: [
      filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    ],
    execute,
  });
  await finalizeMdast(session, mdast, frontmatter, article.file, {
    imageWriteFolder: path.join(path.dirname(output), 'files'),
    imageAltOutputFolder: 'files/',
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    simplifyFigures: false,
    useExistingImages: true,
  });
  const vfile = new VFile();
  vfile.path = output;
  const mdOut = writeIpynb(vfile, mdast as any, frontmatter);
  logMessagesFromVFile(session, mdOut);
  session.log.info(toc(`📑 Exported MD in %s, copying to ${output}`));
  writeFileToFolder(output, mdOut.result as string);
  return { tempFolders: [] };
}
