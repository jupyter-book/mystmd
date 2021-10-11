import * as fs from 'fs';
import path from 'path';
import { VersionId, KINDS } from '@curvenote/blocks';
import { DocxSerializerState, writeDocx } from 'prosemirror-docx';
import { Block, MyUser, Version } from '../models';
import { Session } from '../session';
import { getChildren } from './getChildren';
import {
  createArticleTitle,
  createSingleDocument,
  loadImagesToBuffers,
  walkArticle,
} from '../word';
import { getNodesAndMarks } from '../word/schema';

export async function articleToWord(session: Session, versionId: VersionId) {
  const [me, block, version] = await Promise.all([
    new MyUser(session).get(),
    new Block(session, versionId).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  if (version.data.kind !== KINDS.Article) throw new Error('Not an article');

  const article = await walkArticle(session, version.data);
  const buffers = await loadImagesToBuffers(article);

  const { nodes, marks } = getNodesAndMarks();

  const opts = {
    getImageBuffer(key: string) {
      if (!buffers[key]) throw new Error('Could not decode image from oxa link');
      return buffers[key];
    },
  };

  const docxState = new DocxSerializerState(nodes, marks, opts);

  // Add the title
  docxState.renderContent(await createArticleTitle(session, block.data));
  // Then render each block
  article.states.forEach((state) => {
    if (!state) return;
    docxState.renderContent(state.doc);
  });

  const styles = fs.readFileSync(path.join(__dirname, '../styles/simple.xml'), 'utf-8');

  const doc = createSingleDocument(docxState, {
    title: block.data.title,
    description: block.data.description,
    revision: `${version.id.version}`,
    creator: `${me.data.display_name} on https://curvenote.com`,
    lastModifiedBy: `${me.data.display_name} <${me.data.email}>`,
    keywords: block.data.tags.join(', '),
    externalStyles: styles,
  });

  writeDocx(doc, (buffer) => {
    fs.writeFileSync(`hello.docx`, buffer);
  });
}
