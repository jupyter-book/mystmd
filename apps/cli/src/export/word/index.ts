import fs from 'fs';
import { extname } from 'path';
import { writeDocx } from 'prosemirror-docx';
import type { VersionId } from '@curvenote/blocks';
import { KINDS, ReferenceFormatTypes } from '@curvenote/blocks';
import { Block, MyUser, Project, User, Version } from '../../models';
import type { ISession } from '../../session/types';
import { EditorState } from 'prosemirror-state';
import type { Root } from 'myst-spec';
import { fromMdast } from '@curvenote/schema';
import { parseMyst } from '../../myst';
import { processNotebook } from '../../store/local/notebook';
import { assertEndsInExtension } from '../utils/assertions';
import { exportFromPath } from '../utils/exportWrapper';
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

export async function localArticleToWord(
  session: ISession,
  path: string,
  opts: WordOptions,
  documentCreator = defaultTemplate,
) {
  const { filename, ...docOpts } = opts;
  assertEndsInExtension(filename, 'docx');
  let mdast: Root;
  try {
    const content = fs.readFileSync(path).toString();
    const ext = extname(path).toLowerCase();
    switch (ext) {
      case '.md': {
        mdast = parseMyst(content) as Root;
        break;
      }
      case '.ipynb': {
        mdast = (await processNotebook(session, path, content)) as Root;
        break;
      }
      default:
        throw new Error(`Unrecognized extension ${path}`);
    }
  } catch (err) {
    throw new Error(`Error reading file ${path}: ${err}`);
  }
  const stateDoc = fromMdast(mdast, 'full');
  const state = EditorState.create({ doc: stateDoc });
  const article = {
    children: [{ state }],
    images: {},
    references: {},
    tagged: {},
  };

  const user = await new MyUser(session).get();
  const doc = await documentCreator({
    session,
    user,
    buffers: {},
    authors: [],
    article,
    title: 'temp title',
    description: 'temp description',
    tags: [],
    opts: docOpts,
  });
  await writeDocx(doc, (buffer) => {
    fs.writeFileSync(filename, buffer);
  });

  return article;
}

export async function oxaArticleToWord(
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

export const pathToWord = exportFromPath(oxaArticleToWord, localArticleToWord);
