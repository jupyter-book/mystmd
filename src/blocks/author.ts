import { Author } from "./types";

const DEFAULT_AUTHOR: Author = {
  id: '',
  name: null,
  userId: null,
  orcid: null,
  corresponding: false,
  email: null,
  roles: null,
  affiliations: []
}

export function createAuthor(initialState: {id: string} & Partial<Author>): Author {
  return {
    ...DEFAULT_AUTHOR,
    ...initialState,
  }
}
