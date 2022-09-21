import fs from 'fs';
import path from 'path';
import { writeDocx } from 'prosemirror-docx';
import { EditorState } from 'prosemirror-state';
import type { Image, Root } from 'myst-spec';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import type { VersionId } from '@curvenote/blocks';
import { KINDS, ReferenceFormatTypes } from '@curvenote/blocks';
import { fromMdast } from '@curvenote/schema';
import { Block, MyUser, Project, User, Version } from '../../models';
import type { ISession } from '../../session/types';
import { loadFile, selectFile, transformMdast } from '../../store/local/actions';
import type { References } from '../../transforms/types';
import { createTempFolder, findProjectAndLoad } from '../../utils';
import { assertEndsInExtension } from '../utils/assertions';
import { exportFromPath } from '../utils/exportWrapper';
import { getChildren } from '../utils/getChildren';
import { getEditorState } from '../utils/getEditorState';
import type { ArticleStateReference } from '../utils/walkArticle';
import { loadImagesToBuffers, loadLocalImagesToBuffers, walkArticle } from '../utils/walkArticle';
import { defaultTemplate } from './template';

export * from './schema';
export { getDefaultSerializerOptions } from './utils';
export type { LoadedArticle } from './template';

export type WordOptions = {
  filename: string;
  [key: string]: any;
};

function referencesToWord(references: References) {
  const out: Record<string, ArticleStateReference> = {};
  references.cite.order.forEach((key) => {
    out[key] = { label: key, state: getEditorState(`<p>${references.cite.data[key].html}</p>`) };
  });
  return out;
}

export async function localArticleToWord(
  session: ISession,
  file: string,
  opts: WordOptions,
  documentCreator = defaultTemplate,
) {
  const { filename, ...docOpts } = opts;
  assertEndsInExtension(filename, 'docx');
  await loadFile(session, file);
  await transformMdast(session, {
    file,
    imageWriteFolder: createTempFolder(),
    projectPath: await findProjectAndLoad(session, path.dirname(file)),
  });
  const { frontmatter, mdast, references } = selectFile(session, file);
  const consolidatedChildren = selectAll('block', mdast).reduce((newChildren, block) => {
    newChildren.push(...(block as any).children);
    return newChildren;
  }, [] as GenericNode[]);
  consolidatedChildren.push(...Object.values(references.footnotes));
  const consolidatedMdast = {
    type: 'root',
    children: consolidatedChildren,
  } as Root;
  const articleDoc = fromMdast(consolidatedMdast, 'full');
  const articleChildren = [{ state: EditorState.create({ doc: articleDoc }) }];
  const article = {
    children: articleChildren,
    images: {},
    references: referencesToWord(references),
    tagged: {},
  };

  const user = await new MyUser(session).get();
  const doc = await documentCreator({
    session,
    user,
    buffers: loadLocalImagesToBuffers(selectAll('image', mdast) as Image[]),
    authors: frontmatter.authors || [],
    article,
    title: frontmatter.title || 'Untitled',
    description: frontmatter.description || '',
    tags: frontmatter.tags || [],
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
