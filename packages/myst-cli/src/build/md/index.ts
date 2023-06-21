import path from 'node:path';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { ExportFormats } from 'myst-frontmatter';
import { writeMd } from 'myst-to-md';
import type { LinkTransformer } from 'myst-transforms';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config.js';
import { loadProjectFromDisk } from '../../project/index.js';
import type { ISession } from '../../session/types.js';
import { KNOWN_IMAGE_EXTENSIONS, logMessagesFromVFile } from '../../utils/index.js';
import type { ExportWithOutput, ExportOptions } from '../types.js';
import {
  cleanOutput,
  collectBasicExportOptions,
  getFileContent,
  resolveAndLogErrors,
} from '../utils/index.js';

export async function runMdExport(
  session: ISession,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const toc = tic();
  const { output, article } = exportOptions;
  if (clean) cleanOutput(session, output);
  const [{ mdast, frontmatter }] = await getFileContent(
    session,
    [article],
    path.join(path.dirname(output), 'files'),
    {
      projectPath,
      useExistingImages: true,
      imageAltOutputFolder: 'files/',
      imageExtensions: KNOWN_IMAGE_EXTENSIONS,
      extraLinkTransformers,
      simplifyOutputs: false,
    },
  );
  const vfile = new VFile();
  vfile.path = output;
  const mdOut = writeMd(vfile, mdast as any, frontmatter);
  logMessagesFromVFile(session, mdOut);
  session.log.info(toc(`📑 Exported MD in %s, copying to ${output}`));
  writeFileToFolder(output, mdOut.result as string);
}

export async function localArticleToMd(
  session: ISession,
  file: string,
  opts: ExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
) {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await collectBasicExportOptions(session, file, 'md', [ExportFormats.md], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runMdExport(session, exportOptions, projectPath, opts.clean, extraLinkTransformers);
    }),
    opts.throwOnFailure,
  );
}
