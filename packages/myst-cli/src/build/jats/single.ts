import path from 'path';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { ExportFormats } from 'myst-frontmatter';
import { writeJats } from 'myst-to-jats';
import type { LinkTransformer } from 'myst-transforms';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config';
import { combineCitationRenderers } from '../../process';
import { loadProjectFromDisk } from '../../project';
import { castSession } from '../../session';
import type { ISession } from '../../session/types';
import { KNOWN_IMAGE_EXTENSIONS, logMessagesFromVFile } from '../../utils';
import type { ExportWithOutput, ExportOptions } from '../types';
import {
  cleanOutput,
  collectJatsExportOptions,
  getFileContent,
  resolveAndLogErrors,
} from '../utils';

export async function runJatsExport(
  session: ISession,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const toc = tic();
  const { output, article, sub_articles } = exportOptions;
  if (clean) cleanOutput(session, output);
  const processedContents = (
    await getFileContent(
      session,
      [article, ...(sub_articles ?? [])],
      path.join(path.dirname(output), 'files'),
      {
        projectPath,
        imageAltOutputFolder: 'files/',
        imageExtensions: KNOWN_IMAGE_EXTENSIONS,
        extraLinkTransformers,
      },
    )
  ).map((content) => {
    const { file, mdast, frontmatter } = content;
    const rendererFiles = projectPath ? [projectPath, file] : [file];
    const citations = combineCitationRenderers(castSession(session), ...rendererFiles);
    return { mdast, frontmatter, citations };
  });
  const [processedArticle, ...processedSubArticles] = processedContents;
  const vfile = new VFile();
  vfile.path = output;
  const jats = writeJats(vfile, processedArticle as any, {
    subArticles: processedSubArticles as any,
    fullArticle: true,
    spaces: 2,
  });
  logMessagesFromVFile(session, jats);
  session.log.info(toc(`📑 Exported JATS in %s, copying to ${output}`));
  writeFileToFolder(output, jats.result as string);
}

export async function localArticleToJats(
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
    await collectJatsExportOptions(session, file, 'xml', [ExportFormats.xml], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runJatsExport(session, exportOptions, projectPath, opts.clean, extraLinkTransformers);
    }),
    opts.throwOnFailure,
  );
}
