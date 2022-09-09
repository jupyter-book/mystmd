import type { Author, PageFrontmatter } from '@curvenote/frontmatter';
import type { RendererAuthor, RendererDoc, ValueAndIndex } from './types';

function undefinedIfEmpty<T>(array?: T[]): T[] | undefined {
  // Explicitly return undefined
  if (!array || array.length === 0) return undefined;
  return array;
}

function addIndicesToAuthors(authors: Author[], affiliationList: RendererDoc['affiliations']) {
  const affiliationLookup: Record<string, number> = {};
  affiliationList.forEach(({ name, index }) => {
    affiliationLookup[name] = index;
  });
  let correspondingIndex = 0;
  return authors.map((auth, index) => {
    let corresponding: ValueAndIndex | undefined;
    if (auth.corresponding) {
      corresponding = {
        value: auth.corresponding,
        ...indexAndLetter(correspondingIndex),
      };
      correspondingIndex += 1;
    }
    let affiliations = auth.affiliations?.map((value) => {
      return { ...affiliationLookup[value] };
    });
    return { ...auth, index, affiliations: undefinedIfEmpty(affiliations) };
  });
}

function affiliationsFromAuthors(authors: Author[]): ValueAndIndex[] {
  const allAffiliations = authors.map((auth) => auth.affiliations || []).flat();
  return [...new Set(allAffiliations)].map((value, index) => {
    return { value, ...indexAndLetter(index) };
  });
}

export function extendJtexFrontmatter(frontmatter: PageFrontmatter): RendererDoc {
  const datetime = frontmatter.date ? new Date(frontmatter.date) : new Date();
  const affiliations = affiliationsFromAuthors(frontmatter.authors || []);
  const doc: RendererDoc = {
    title: frontmatter.title,
    short_title: frontmatter.short_title,
    description: frontmatter.description,
    date: {
      day: String(datetime.getDate()),
      month: String(datetime.getMonth() + 1),
      year: String(datetime.getFullYear()),
    },
    authors: addIndicesToAuthors(frontmatter.authors || [], affiliations),
    affiliations,
    bibliography: undefinedIfEmpty(frontmatter.bibliography),
    keywords: frontmatter.keywords,
  };
  return doc;
}
