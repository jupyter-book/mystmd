import path from 'node:path';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { FRONTMATTER_ALIASES, PAGE_FRONTMATTER_KEYS } from 'myst-frontmatter';
import { writeJats } from 'myst-to-jats';
import { filterKeys } from 'simple-validators';
import { VFile } from 'vfile';
import { combineCitationRenderers } from '../../process/citations.js';
import { finalizeMdast } from '../../process/mdast.js';
import { castSession } from '../../session/cache.js';
import type { ISession } from '../../session/types.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { KNOWN_IMAGE_EXTENSIONS } from '../../utils/resolveExtension.js';
import { resolveFrontmatterParts } from '../../utils/resolveFrontmatterParts.js';
import type { ExportWithOutput, ExportFnOptions } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { getFileContent } from '../utils/getFileContent.js';

/**
 * Build a MyST project as JATS XML
 *
 * @param session session with logging
 * @param opts configuration options
 */
export async function runJatsExport(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
) {
  const toc = tic();
  const { output, articles, sub_articles } = exportOptions;
  const { clean, projectPath, extraLinkTransformers, execute } = opts ?? {};
  // At this point, export options are resolved to contain one-and-only-one article
  const article = articles[0];
  if (!article?.file) return { tempFolders: [] };
  if (clean) cleanOutput(session, output);
  const processedContents = (
    await getFileContent(session, [article.file, ...(sub_articles ?? [])], {
      projectPath,
      imageExtensions: KNOWN_IMAGE_EXTENSIONS,
      extraLinkTransformers,
      preFrontmatters: [
        filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
      ], // only apply to article, not sub_articles
      execute,
    })
  ).map((content) => {
    const { kind, file, mdast, frontmatter, slug } = content;
    const rendererFiles = projectPath ? [projectPath, file] : [file];
    const citations = combineCitationRenderers(castSession(session), ...rendererFiles);
    return { mdast, kind, frontmatter, citations, slug, file };
  });
  await Promise.all(
    processedContents.map(({ mdast, frontmatter, file }) => {
      return finalizeMdast(session, mdast, frontmatter, file, {
        imageWriteFolder: path.join(path.dirname(output), 'files'),
        imageAltOutputFolder: 'files/',
        imageExtensions: KNOWN_IMAGE_EXTENSIONS,
        simplifyFigures: false,
      });
    }),
  );
  const [processedArticle, ...processedSubArticles] = processedContents.map(
    ({ frontmatter, ...contents }) => {
      const parts = resolveFrontmatterParts(session, frontmatter);
      return { frontmatter: { ...frontmatter, parts }, ...contents };
    },
  );
  const vfile = new VFile();
  vfile.path = output;
  const jats = writeJats(vfile, processedArticle as any, {
    subArticles: processedSubArticles as any,
    writeFullArticle: true,
    format: 'pretty',
    abstractParts: [
      { part: 'abstract' },
      {
        part: [
          'plain-language-summary',
          'plain-language-abstract',
          'summary',
          'plain language summary',
        ],
        type: 'plain-language-summary',
        title: 'Plain Language Summary',
      },
      { part: 'keypoints', type: 'key-points', title: 'Key Points' },
    ],
    backSections: [
      {
        part: ['data-availability', 'data_availability', 'availability', 'data availability'],
        type: 'data-availability',
        title: 'Data Availability',
      },
    ],
    // if we want to add templating here, we have access to { ...processedArticle.frontmatter.options, ...exportOptions }
  });
  logMessagesFromVFile(session, jats);
  session.log.info(toc(`📑 Exported JATS in %s, copying to ${output}`));
  writeFileToFolder(output, jats.result as string);
  return { tempFolders: [] };
}
