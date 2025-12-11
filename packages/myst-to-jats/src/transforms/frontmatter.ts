import type { PageFrontmatter } from 'myst-frontmatter';

/**
 * Replace ids of affiliations associated with authors
 *
 * This does not change the ids of affiliations that are
 * not referenced anywhere or only referenced in funding,
 * as those ids do not come through to JATS.
 *
 * Also, it treats each frontmatter separately, so if one
 * affiliation appears in multiple articles/sub-articles,
 * it will be given a different id for each and be part
 * of the JATS frontmatter for each.
 */
export function affiliationIdTransform(
  frontmatters: PageFrontmatter[],
  idPrefix: string | ((count: number) => string),
) {
  let affCount = 0;
  frontmatters.forEach((frontmatter) => {
    const idLookup: Record<string, string> = {};
    // Only modify ids of affiliations associated with authors
    frontmatter.authors?.forEach((auth) => {
      if (!auth.affiliations?.length) return;
      auth.affiliations = auth.affiliations.map((aff) => {
        if (idLookup[aff]) {
          return idLookup[aff];
        } else {
          affCount += 1;
          const id =
            typeof idPrefix === 'function' ? idPrefix(affCount) : `${idPrefix}-${affCount}`;
          idLookup[aff] = id;
          return id;
        }
      });
    });
    // Replace affiliation values in funding sources
    frontmatter.funding?.forEach((funding) => {
      funding.awards?.forEach((award) => {
        if (!award.sources) return;
        award.sources = award.sources.map((source) => {
          if (idLookup[source]) return idLookup[source];
          return source;
        });
      });
    });
    // Replace affiliation ids in affiliation list
    frontmatter.affiliations?.forEach((aff) => {
      if (aff.id && idLookup[aff.id]) {
        aff.id = idLookup[aff.id];
      }
    });
  });
}
