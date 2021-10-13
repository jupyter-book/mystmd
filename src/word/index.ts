import * as fs from 'fs';
import path from 'path';
import { VersionId, KINDS, oxaLinkToId } from '@curvenote/blocks';
import { DocxSerializerState, writeDocx } from 'prosemirror-docx';
import { Block, MyUser, Version } from '../models';
import { Session } from '../session';
import { getChildren } from '../actions/getChildren';
import { getNodesAndMarks } from './schema';
import { getLatestBlock } from '../actions/getLatest';
import { createSingleDocument, loadImagesToBuffers, walkArticle } from './utils';
import { createArticleTitle } from './titles';

function assertEndsInDocx(filename: string) {
  if (!filename.endsWith('.docx'))
    throw new Error(`The filename must end with '.docx': "${filename}"`);
}

export async function articleToWord(session: Session, versionId: VersionId, filename: string) {
  assertEndsInDocx(filename);
  const [me, block, version] = await Promise.all([
    new MyUser(session).get(),
    new Block(session, versionId).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId), // This loads all the children quickly
  ]);
  if (version.data.kind !== KINDS.Article)
    throw new Error(`The export source must be of kind "Article" not ${version.data.kind}`);

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

  // TODO: this could come from an existing word doc
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
    fs.writeFileSync(filename, buffer);
  });
}

export async function oxaLinkToWord(session: Session, link: string, filename: string) {
  assertEndsInDocx(filename);
  const id = oxaLinkToId(link);
  if (!id) throw new Error('The article ID provided could not be parsed.');
  if ('version' in id.block) {
    // Ensure that we actually get a correct ID, and then use the version supplied
    const block = await new Block(session, id.block).get();
    await articleToWord(session, { ...block.id, version: id.block.version }, filename);
  } else {
    // Here we will load up the latest version
    const { version } = await getLatestBlock(session, id.block);
    await articleToWord(session, version.id, filename);
  }
}
