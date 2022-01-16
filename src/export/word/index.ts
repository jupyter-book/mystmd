import fs from 'fs';
import { VersionId, KINDS } from '@curvenote/blocks';
import { writeDocx } from 'prosemirror-docx';
import { Block, User, Version } from '../../models';
import { getChildren } from '../../actions/getChildren';
import { loadImagesToBuffers, walkArticle } from '../utils';
import { exportFromOxaLink } from '../utils/exportWrapper';
import { defaultTemplate } from './template';
import { ISession } from '../../session/types';

export * from './schema';
export type { LoadedArticle } from './template';

export type WordOptions = {
  filename: string;
  [key: string]: any;
};

function assertEndsInDocx(filename: string) {
  if (!filename.endsWith('.docx'))
    throw new Error(`The filename must end with '.docx': "${filename}"`);
}

export async function articleToWord(
  session: ISession,
  versionId: VersionId,
  opts: WordOptions,
  documentCreator = defaultTemplate,
) {
  const { filename, ...docOpts } = opts;
  assertEndsInDocx(filename);
  const [block, version] = await Promise.all([
    new Block(session, versionId).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId), // This loads all the children quickly
  ]);
  if (version.data.kind !== KINDS.Article)
    throw new Error(`The export source must be of kind "Article" not ${version.data.kind}`);

  const user = await new User(session, version.data.created_by).get();
  const article = await walkArticle(session, version.data);
  const buffers = await loadImagesToBuffers(article.images);

  const doc = await documentCreator({
    session,
    user,
    buffers,
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
