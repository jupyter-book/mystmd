import { Author } from './types';

const DEFAULT_AUTHOR: Author = {
  id: '',
  name: null,
  userId: null,
  orcid: null,
  corresponding: false,
  email: null,
  roles: [],
  affiliations: [],
};

export function createAuthor(initialState: { id: string } & Partial<Author>): Author {
  const affiliations = initialState.affiliations ? [...initialState.affiliations] : [];
  const roles = initialState.roles ? [...initialState.roles] : [];
  return {
    ...DEFAULT_AUTHOR,
    ...initialState,
    affiliations,
    roles,
  };
}
