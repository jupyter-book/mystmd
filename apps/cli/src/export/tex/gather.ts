import path from 'path';
import type { VersionId } from '@curvenote/blocks';
import { KINDS, convertToBlockId } from '@curvenote/blocks';
import { fillPageFrontmatter } from 'myst-frontmatter';
import {
  saveAffiliations,
  pageFrontmatterFromDTO,
  projectFrontmatterFromDTO,
} from '../../frontmatter/api';
import { Block, Project, Version } from '../../models';
import type { ISession } from '../../session/types';
import { getChildren } from '../utils/getChildren';
import type { ArticleState } from '../utils/walkArticle';
import { walkArticle } from '../utils/walkArticle';
import { validateJtexFrontmatterKeys } from '../validators';
import type { LatexFrontmatter } from './frontmatter';
import { buildJtexSection, escapeLatex, stringifyFrontmatter } from './frontmatter';
import { localizeAndProcessImages } from './images';
import type { TexExportOptionsExpanded } from './types';
import { convertAndLocalizeChild, writeBlocksToFile, writeTaggedContent } from './utils';

export async function gatherAndWriteArticleContent(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptionsExpanded,
  tagged: string[],
  templateOptions: Record<string, any>,
  buildPath: string,
): Promise<{
  article: ArticleState;
  filename: string;
  taggedFilenames: Record<string, string>;
  model: LatexFrontmatter;
}> {
  session.log.debug('Fetching data from API...');
  const [project, block, version] = await Promise.all([
    new Project(session, versionId.project).get(),
    new Block(session, convertToBlockId(versionId)).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');

  session.log.debug('Start walkArticle...');
  const article = await walkArticle(session, data, tagged);

  const imageFilenames = await localizeAndProcessImages(session, article, opts, buildPath);

  const taggedFilenames: Record<string, string> = await writeTaggedContent(
    session,
    article,
    imageFilenames,
    buildPath,
  );

  session.log.debug('Building front matter...');
  const frontmatterOpts = {
    escapeFn: escapeLatex,
  };
  saveAffiliations(session, project.data);
  const projectFrontmatter = projectFrontmatterFromDTO(session, project.data, frontmatterOpts);
  let pageFrontmatter = pageFrontmatterFromDTO(session, block.data, data.date, frontmatterOpts);
  pageFrontmatter = fillPageFrontmatter(pageFrontmatter, projectFrontmatter);
  const frontmatter: LatexFrontmatter = {
    ...pageFrontmatter,
    jtex: buildJtexSection(
      taggedFilenames,
      templateOptions,
      {
        path: opts.texIsIntermediate ?? false ? '.' : '..', // jtex path is always relative to the content file
        filename: path.basename(opts.filename ?? ''),
        copy_images: true,
        single_file: false,
      },
      opts.template ?? null,
      Object.keys(article.references).length > 0 ? 'main.bib' : null,
    ),
  };

  const validFrontmatter = validateJtexFrontmatterKeys(frontmatter, {
    property: 'jtex',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  });

  const filename = opts.multiple
    ? path.join(buildPath, 'chapters', opts.filename ?? '')
    : path.join(buildPath, path.basename(opts.filename ?? ''));
  session.log.debug(`Writing main body of content to ${filename}`);
  session.log.debug(`Document has ${article.children.length} child blocks`);
  writeBlocksToFile(
    article.children,
    (child) => convertAndLocalizeChild(session, child, imageFilenames, article.references),
    filename,
    stringifyFrontmatter(validFrontmatter),
  );

  return { article, filename, taggedFilenames, model: frontmatter };
}
