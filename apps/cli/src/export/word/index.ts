import fs from 'fs';
import { writeDocx } from 'prosemirror-docx';
import { VersionId, KINDS, ReferenceFormatTypes } from '@curvenote/blocks';
import { Block, Project, User, Version } from '../../models';
import { ISession } from '../../session/types';
import { assertEndsInExtension } from '../utils/assertions';
import { exportFromOxaLink } from '../utils/exportWrapper';
import { getChildren } from '../utils/getChildren';
import { loadImagesToBuffers, walkArticle } from '../utils/walkArticle';
import { defaultTemplate } from './template';

export * from './schema';
export { getDefaultSerializerOptions } from './utils';
export type { LoadedArticle } from './template';

export type WordOptions = {
  filename: string;
  [key: string]: any;
};

export async function articleToWord(
  session: ISession,
  versionId: VersionId,
  opts: WordOptions,
  documentCreator = defaultTemplate,
) {
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
    project,
    block,
    version,
    article,
    opts: docOpts,
  });

  await writeDocx(doc, (buffer) => {
    fs.writeFileSync(filename, buffer);
  });

  return article;
}

export const oxaLinkToWord = exportFromOxaLink(articleToWord);
