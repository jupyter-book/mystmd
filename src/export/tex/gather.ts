import { Blocks, VersionId, KINDS, convertToBlockId } from '@curvenote/blocks';
import path from 'path';
import { Block, Version } from '../../models';
import { ISession } from '../../session/types';
import { getChildren } from '../../actions/getChildren';
import { buildFrontMatter, stringifyFrontMatter } from './frontMatter';
import { walkArticle, makeBuildPaths, ArticleState } from '../utils';
import { TexExportOptions } from './types';
import { convertAndLocalizeChild, writeBlocksToFile, writeTaggedContent } from './utils';
import { localizeAndProcessImages } from './images';

export async function gatherArticleContent(
  session: ISession,
  versionId: VersionId,
  document: ArticleState,
  opts: TexExportOptions,
  tagged: string[],
  templateOptions: Record<string, any>,
) {
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
  const { children } = await walkArticle(session, document, data, tagged);

  const imageFilenames = await localizeAndProcessImages(session, document, opts, buildPath);

  const taggedFilenames: Record<string, string> = await writeTaggedContent(
    session,
    document,
    imageFilenames,
    buildPath,
  );

  session.log.debug('Building front matter...');
  const frontMatter = stringifyFrontMatter(
    await buildFrontMatter(
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
      Object.keys(document.references).length > 0 ? 'main.bib' : null,
    ),
  );

  const contentTexFile = path.join(buildPath, 'content.tex');
  session.log.debug(`Writing main body of content to ${contentTexFile}`);
  session.log.debug(`Document has ${children.length} child blocks`);
  writeBlocksToFile(
    children,
    (child) => convertAndLocalizeChild(session, child, imageFilenames, document.references),
    contentTexFile,
    frontMatter,
  );

  return { article: document, contentTexFile };
}
