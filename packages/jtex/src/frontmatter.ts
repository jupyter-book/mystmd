import type { Author, PageFrontmatter } from '@curvenote/frontmatter';
import type { ValidationOptions } from '@curvenote/validators';
import { validateObjectKeys } from '@curvenote/validators';
import { errorLogger } from './validators';
import type { ISession, RendererDoc } from './types';

function addIndicesToAuthors(authors: Author[], affiliationList: RendererDoc['affiliations']) {
  const affiliationLookup: Record<string, number> = {};
  affiliationList.forEach(({ name, index }) => {
    affiliationLookup[name] = index;
  });
  return authors.map((auth, index) => {
    const affiliations =
      auth.affiliations?.map((name) => {
        return { name, index: affiliationLookup[name] };
      }) || [];
    return { ...auth, index, affiliations };
  });
}

function affiliationsFromAuthors(authors: Author[]) {
  const allAffiliations = authors.map((auth) => auth.affiliations || []).flat();
  return [...new Set(allAffiliations)].map((name, index) => {
    return { name, index };
  });
}

export function extendJtexFrontmatter(
  session: ISession,
  frontmatter: PageFrontmatter,
): RendererDoc {
  const datetime = frontmatter.date ? new Date(frontmatter.date) : new Date();
  const opts: ValidationOptions = {
    property: 'frontmatter',
    messages: {},
    errorLogFn: errorLogger(session),
  };
  // Additional validation beyond standard frontmatter validation
  const filteredFm = validateObjectKeys(
    frontmatter,
    { required: ['title', 'description', 'authors'] },
    opts,
  );
  if (opts.messages.errors?.length || !filteredFm) {
    throw new Error('Required frontmatter missing for export');
  }
  const affiliations = affiliationsFromAuthors(frontmatter.authors || []);
  const doc: RendererDoc = {
    title: filteredFm.title || '',
    description: filteredFm.description || '',
    date: {
      day: String(datetime.getDate()),
      month: String(datetime.getMonth() + 1),
      year: String(datetime.getFullYear()),
    },
    authors: addIndicesToAuthors(frontmatter.authors || [], affiliations),
    affiliations,
    keywords: frontmatter.keywords,
  };
  return doc;
}
