import { Document } from 'docx';
import { Node } from 'prosemirror-model';
import { DocxSerializerState } from 'prosemirror-docx';
import { Block, Project, User, Version } from '../../models';
import { ISession } from '../../session/types';
import { ArticleState } from '../utils/walkArticle';
import { getNodesAndMarks } from './schema';
import { createArticleTitle, createReferenceTitle } from './titles';
import { createSingleDocument, getDefaultSerializerOptions } from './utils';
import { DEFAULT_STYLES } from './simpleStyles';

export interface LoadedArticle {
  session: ISession;
  user: User;
  buffers: Record<string, Buffer>;
  project: Project;
  block: Block;
  version: Version;
  article: ArticleState;
  opts: Record<string, any>;
}

export async function defaultTemplate(data: LoadedArticle): Promise<Document> {
  const { session, user, buffers, project, block, version, article } = data;

  const { nodes, marks } = getNodesAndMarks();

  const docxState = new DocxSerializerState(nodes, marks, getDefaultSerializerOptions(buffers));

  // Add the title
  docxState.renderContent(await createArticleTitle(session, project.data, block.data));
  // Then render each block
  article.children.forEach(({ state }) => {
    if (!state) return;
    docxState.renderContent(state.doc);
  });

  // render references with title if they exist
  const referencesDocStates = Object.values(article.references)
    .map(({ state }) => state?.doc)
    .filter((docState): docState is Node => !!docState);
  if (referencesDocStates.length > 0) {
    docxState.renderContent(createReferenceTitle());
  }
  referencesDocStates.forEach((docState) => {
    docxState.renderContent(docState);
  });

  // TODO: this could come from an existing word doc
  const styles = DEFAULT_STYLES;

  const doc = createSingleDocument(docxState, {
    title: block.data.title,
    description: block.data.description,
    revision: version.id.version ?? 1,
    creator: `${user.data.display_name} on https://curvenote.com`,
    lastModifiedBy: `${user.data.display_name} (@${user.data.username})`,
    keywords: block.data.tags.join(', '),
    externalStyles: styles,
  });

  return doc;
}
