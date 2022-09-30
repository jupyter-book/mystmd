import fs from 'fs';
import { writeDocx } from 'prosemirror-docx';
import type { VersionId } from '@curvenote/blocks';
import { KINDS, ReferenceFormatTypes } from '@curvenote/blocks';
import { Block, Project, User, Version } from '../../models';
import type { ISession } from '../../session/types';
import { assertEndsInExtension } from '../utils/assertions';
import { localExportWrapper } from '../utils/localExportWrapper';
import { getChildren } from '../utils/getChildren';
import { loadImagesToBuffers, walkArticle } from '../utils/walkArticle';
import { defaultTemplate } from './template';
import { localArticleToWord } from './single';

export * from './schema';
export { getDefaultSerializerOptions } from './utils';
export type { LoadedArticle } from './template';

export type WordOptions = {
  filename: string;
  [key: string]: any;
};

export async function oxaArticleToWord(
  session: ISession,
  versionId: VersionId,
  opts: WordOptions,
  documentCreator = defaultTemplate,
) {
  if (!opts.filename) opts.filename = 'article.docx';
  const { filename, ...docOpts } = opts;
  assertEndsInExtension(filename, 'docx');
  const [project, block, version] = await Promise.all([
    new Project(session, versionId.project).get(),
    new Block(session, versionId).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId), // This loads all the children quickly, but does not fetch
  ]);
  if (version.data.kind !== KINDS.Article)
    throw new Error(`The export source must be of kind "Article" not ${version.data.kind}`);

  const user = await new User(session, version.data.created_by).get();
  const article = await walkArticle(session, version.data, [], ReferenceFormatTypes.html);
  const buffers = await loadImagesToBuffers(article.images);

  const doc = await documentCreator({
    session,
    user,
    buffers,
    authors: block.data.authors ?? project.data.authors ?? [],
    versionId: version.id.version || undefined,
    article,
    title: block.data.title,
    description: block.data.description,
    tags: block.data.tags,
    opts: docOpts,
  });

  await writeDocx(doc, (buffer) => {
    fs.writeFileSync(filename, buffer);
  });

  return article;
}

export const pathToWord = localExportWrapper(localArticleToWord);
