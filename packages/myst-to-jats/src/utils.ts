import type { IJatsSerializer } from './types.js';

export function notebookArticleSuffix(state: IJatsSerializer) {
  return state.data.isNotebookArticleRep ? '-article' : '';
}

export function slugSuffix(state: IJatsSerializer) {
  return state.data.slug ? `-${state.data.slug}` : '';
}
