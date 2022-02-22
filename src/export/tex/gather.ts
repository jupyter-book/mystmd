import { Blocks, VersionId, KINDS, convertToBlockId } from '@curvenote/blocks';
import { DocumentModel } from 'export';
import { Block, Version } from '../../models';
import { ISession } from '../../session/types';
import { getChildren } from '../../actions/getChildren';
import { buildFrontMatterFromBlock, stringifyFrontMatter } from './frontMatter';
import { walkArticle, makeBuildPaths, ArticleState } from '../utils';
import { TexExportOptions } from './types';
import { convertAndLocalizeChild, writeBlocksToFile, writeTaggedContent } from './utils';
import { localizeAndProcessImages } from './images';

export async function gatherArticleContent(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
  tagged: string[],
  templateOptions: Record<string, any>,
): Promise<{
  article: ArticleState;
  taggedFilenames: Record<string, string>;
  model: DocumentModel;
}> {
  const { buildPath, outputFilename } = makeBuildPaths(session.log, opts);

  session.log.debug('Fetching data from API...');
  const [block, version] = await Promise.all([
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
  const frontMatter = await buildFrontMatterFromBlock(
    session,
    block,
    version as Version<Blocks.Article>,
    taggedFilenames,
    templateOptions,
    {
      path: opts.texIsIntermediate ?? false ? '.' : '..', // jtex path is always relative to the content file
      filename: outputFilename,
      copy_images: true,
      single_file: false,
    },
    opts.template ?? null,
    Object.keys(article.references).length > 0 ? 'main.bib' : null,
  );

  const { filename } = opts;
  session.log.debug(`Writing main body of content to ${filename}`);
  session.log.debug(`Document has ${article.children.length} child blocks`);
  writeBlocksToFile(
    article.children,
    (child) => convertAndLocalizeChild(session, child, imageFilenames, article.references),
    filename,
    stringifyFrontMatter(frontMatter),
  );

  return { article, taggedFilenames, model: frontMatter };
}
