import type { Document } from 'docx';
import type { Node } from 'prosemirror-model';
import { DocxSerializerState } from 'prosemirror-docx';
import type { MyUser, User } from '../../models';
import type { ISession } from '../../session/types';
import type { ArticleState } from '../utils/walkArticle';
import { getNodesAndMarks } from './schema';
import { createArticleTitle, createReferenceTitle } from './titles';
import { createSingleDocument, getDefaultSerializerOptions } from './utils';
import DEFAULT_STYLE from './simpleStyles';
import type { Author } from '@curvenote/blocks';

export interface LoadedArticle {
  session: ISession;
  user: User | MyUser;
  buffers: Record<string, Buffer>;
  authors: Partial<Author>[];
  versionId?: number;
  article: ArticleState;
  title: string;
  description: string;
  tags: string[];
  opts: Record<string, any>;
}

export async function defaultTemplate(data: LoadedArticle): Promise<Document> {
  const { user, buffers, authors, versionId, article, title, description, tags } = data;

  const { nodes, marks } = getNodesAndMarks();

  const docxState = new DocxSerializerState(nodes, marks, getDefaultSerializerOptions(buffers));

  // Add the title
  docxState.renderContent(await createArticleTitle(title, authors));
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
  const styles = DEFAULT_STYLE;

  const doc = createSingleDocument(docxState, {
    title,
    description,
    revision: versionId ?? 1,
    creator: `${user.data.display_name} on https://curvenote.com`,
    lastModifiedBy: `${user.data.display_name} (@${user.data.username})`,
    keywords: tags.join(', '),
    externalStyles: styles,
  });

  return doc;
}
