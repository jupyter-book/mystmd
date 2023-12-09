import path from 'node:path';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { ExportFormats } from 'myst-frontmatter';
import { writeMd } from 'myst-to-md';
import type { LinkTransformer } from 'myst-transforms';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config.js';
import { finalizeMdast } from '../../process/mdast.js';
import { loadProjectFromDisk } from '../../project/load.js';
import type { ISession } from '../../session/types.js';
import { collectBasicExportOptions } from '../utils/collectExportOptions.js';
import { logMessagesFromVFile } from '../../utils/logMessagesFromVFile.js';
import { resolveAndLogErrors } from '../utils/resolveAndLogErrors.js';
import { KNOWN_IMAGE_EXTENSIONS } from '../../utils/resolveExtension.js';
import type { ExportWithOutput, ExportOptions } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { getFileContent } from '../utils/getFileContent.js';

export async function runMdExport(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const toc = tic();
  const { output, articles } = exportOptions;
  // At this point, export options are resolved to contain one-and-only-one article
  const article = articles[0];
  if (!article) return { tempFolders: [] };
  if (clean) cleanOutput(session, output);
  const [{ mdast, frontmatter }] = await getFileContent(session, [article], {
    projectPath,
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });
  await finalizeMdast(session, mdast, frontmatter, article, {
    imageWriteFolder: path.join(path.dirname(output), 'files'),
    imageAltOutputFolder: 'files/',
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    simplifyFigures: false,
    useExistingImages: true,
  });
  const vfile = new VFile();
  vfile.path = output;
  const mdOut = writeMd(vfile, mdast as any, frontmatter);
  logMessagesFromVFile(session, mdOut);
  session.log.info(toc(`📑 Exported MD in %s, copying to ${output}`));
  writeFileToFolder(output, mdOut.result as string);
  return { tempFolders: [] };
}

export async function localArticleToMd(
  session: ISession,
  file: string,
  opts: ExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
) {
  let { projectPath } = opts;
  if (!projectPath) projectPath = findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await collectBasicExportOptions(session, file, 'md', [ExportFormats.md], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runMdExport(
        session,
        file,
        exportOptions,
        projectPath,
        opts.clean,
        extraLinkTransformers,
      );
    }),
    opts.throwOnFailure,
  );
}
