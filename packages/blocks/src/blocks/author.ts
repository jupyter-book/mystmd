import type { Author } from './types';

export function createAuthor(initialState: { id: string } & Partial<Author>): Author {
  const affiliations = initialState.affiliations ? [...initialState.affiliations] : [];
  const roles = initialState.roles ? [...initialState.roles] : [];
  return {
    id: initialState.id ?? '',
    name: initialState.name ?? null,
    userId: initialState.userId ?? null,
    orcid: initialState.orcid ?? null,
    corresponding: initialState.corresponding ?? false,
    email: initialState.email ?? null,
    affiliations,
    roles,
  };
}
