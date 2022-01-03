import * as fs from 'fs';
import { VersionId, KINDS } from '@curvenote/blocks';
import { DocxSerializerState, writeDocx } from 'prosemirror-docx';
import pkgpath from '../../pkgpath';
import { Block, User, Version } from '../../models';
import { Session } from '../../session';
import { getChildren } from '../../actions/getChildren';
import { getNodesAndMarks } from './schema';
import { loadImagesToBuffers, walkArticle } from '../utils';
import { createArticleTitle } from './titles';
import { exportFromOxaLink } from '../utils/exportWrapper';
import { createSingleDocument } from './utils';

function assertEndsInDocx(filename: string) {
  if (!filename.endsWith('.docx'))
    throw new Error(`The filename must end with '.docx': "${filename}"`);
}

export async function articleToWord(
  session: Session,
  versionId: VersionId,
  opts: { filename: string },
) {
  assertEndsInDocx(opts.filename);
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

  const { nodes, marks } = getNodesAndMarks();

  const docxState = new DocxSerializerState(nodes, marks, {
    getImageBuffer(key: string) {
      if (!buffers[key]) throw new Error('Could not decode image from oxa link');
      return buffers[key];
    },
  });

  // Add the title
  docxState.renderContent(await createArticleTitle(session, block.data));
  // Then render each block
  article.children.forEach(({ state }) => {
    if (!state) return;
    docxState.renderContent(state.doc);
  });

  // TODO: this could come from an existing word doc
  const styles = fs.readFileSync(pkgpath('styles/simple.xml'), 'utf-8');

  const doc = createSingleDocument(docxState, {
    title: block.data.title,
    description: block.data.description,
    revision: version.id.version ?? 1,
    creator: `${user.data.display_name} on https://curvenote.com`,
    lastModifiedBy: `${user.data.display_name} (@${user.data.username})`,
    keywords: block.data.tags.join(', '),
    externalStyles: styles,
  });

  await writeDocx(doc, (buffer) => {
    fs.writeFileSync(opts.filename, buffer);
  });
}

export const oxaLinkToWord = exportFromOxaLink(articleToWord);
