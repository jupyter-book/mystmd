import type { IJatsSerializer } from './types';

export function notebookArticleSuffix(state: IJatsSerializer) {
  return state.data.isNotebookArticleRep ? '-article' : '';
}
