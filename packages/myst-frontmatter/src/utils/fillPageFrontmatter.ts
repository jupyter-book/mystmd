import type { ValidationOptions } from 'simple-validators';
import { fillMissingKeys, incrementOptions, validationWarning } from 'simple-validators';
import type { Affiliation } from '../affiliations/types.js';
import type { Contributor } from '../contributors/types.js';
import { fillNumbering } from '../numbering/validators.js';
import { USE_PROJECT_FALLBACK } from '../page/validators.js';
import type { PageFrontmatter } from '../page/types.js';
import type { ProjectFrontmatter } from '../project/types.js';
import type { SiteFrontmatter } from '../site/types.js';
import { normalizeJsonToString } from './normalizeString.js';
import { isStashPlaceholder, stashPlaceholder } from './referenceStash.js';

/**
 * Fill missing values from page frontmatter object with values from project frontmatter
 *
 * This only applies to frontmatter values where overriding is the correct behavior.
 * For example, if page has no 'title' the project 'title' is not filled in.
 */
export function fillPageFrontmatter(
  pageFrontmatter: PageFrontmatter,
  projectFrontmatter: ProjectFrontmatter,
  opts: ValidationOptions,
): PageFrontmatter {
  return fillProjectFrontmatter(
    pageFrontmatter,
    projectFrontmatter,
    opts,
    USE_PROJECT_FALLBACK,
    true,
  );
}

export function fillSiteFrontmatter(
  base: SiteFrontmatter,
  filler: SiteFrontmatter,
  opts: ValidationOptions,
  keys?: string[],
  trimUnused?: boolean,
) {
  const frontmatter = fillMissingKeys(base, filler, keys ?? Object.keys(filler));

  // Combine all options defined on page and project
  if (filler.options || base.options) {
    frontmatter.options = {
      ...(filler.options ?? {}),
      ...(base.options ?? {}),
    };
  }

  // Gather all contributor and affiliation ids from funding sources
  const contributorIds: Set<string> = new Set();
  const affiliationIds: Set<string> = new Set();
  frontmatter.funding?.forEach((fund) => {
    fund.awards?.forEach((award) => {
      award.investigators?.forEach((inv) => {
        contributorIds.add(inv);
      });
      award.recipients?.forEach((rec) => {
        contributorIds.add(rec);
      });
      award.sources?.forEach((aff) => {
        affiliationIds.add(aff);
      });
    });
  });

  // Gather all contributor ids from reviewers and editors
  frontmatter.reviewers?.forEach((reviewer) => {
    contributorIds.add(reviewer);
  });
  frontmatter.editors?.forEach((editor) => {
    contributorIds.add(editor);
  });

  if (!trimUnused) {
    [
      ...(base.authors ?? []),
      ...(filler.authors ?? []),
      ...(base.contributors ?? []),
      ...(filler.contributors ?? []),
    ].forEach((auth) => {
      if (auth.id) contributorIds.add(auth.id);
    });
    [...(base.affiliations ?? []), ...(filler.affiliations ?? [])].forEach((aff) => {
      if (aff.id) affiliationIds.add(aff.id);
    });
    if (filler.tags || base.tags) {
      frontmatter.tags = [...new Set([...(filler.tags ?? []), ...(base.tags ?? [])])];
    }
    if (filler.reviewers || base.reviewers) {
      frontmatter.reviewers = [
        ...new Set([...(filler.reviewers ?? []), ...(base.reviewers ?? [])]),
      ];
    }
    if (filler.editors || base.editors) {
      frontmatter.editors = [...new Set([...(filler.editors ?? []), ...(base.editors ?? [])])];
    }
    if (filler.keywords || base.keywords) {
      frontmatter.keywords = [...new Set([...(filler.keywords ?? []), ...(base.keywords ?? [])])];
    }
    if (filler.funding || base.funding) {
      // This does nothing to deduplicate repeated awards
      frontmatter.funding = [...(filler.funding ?? []), ...(base.funding ?? [])];
    }
  }

  if (frontmatter.authors?.length || contributorIds.size) {
    // Gather all people from page/project authors/contributors
    const people = [
      ...(base.authors ?? []),
      ...(filler.authors ?? []),
      ...(base.contributors ?? []),
      ...(filler.contributors ?? []),
    ];
    const peopleLookup: Record<string, Contributor> = {};
    people.forEach((auth) => {
      if (!auth.id || isStashPlaceholder(auth)) return;
      if (!peopleLookup[auth.id]) {
        peopleLookup[auth.id] = auth;
      } else if (normalizeJsonToString(auth) !== normalizeJsonToString(peopleLookup[auth.id])) {
        validationWarning(
          `Duplicate contributor id within project: ${auth.id}`,
          incrementOptions('authors', opts),
        );
      }
    });
    if (frontmatter.authors?.length) {
      frontmatter.authors = frontmatter.authors.map((auth) => {
        if (!auth.id) return auth;
        // If contributors are in final author list, do not add to contributor list
        contributorIds.delete(auth.id);
        return peopleLookup[auth.id] ?? stashPlaceholder(auth.id);
      });
    }
    if (contributorIds.size) {
      frontmatter.contributors = [...contributorIds].map((id) => {
        return peopleLookup[id] ?? stashPlaceholder(id);
      });
    }
  }

  // Add affiliations from reconstructed author/contributor lists and explicit page affiliations
  [...(frontmatter.authors ?? []), ...(frontmatter.contributors ?? [])].forEach((auth) => {
    auth.affiliations?.forEach((aff) => {
      affiliationIds.add(aff);
    });
  });
  frontmatter.affiliations?.forEach((aff) => {
    if (aff.id) affiliationIds.add(aff.id);
  });

  if (affiliationIds.size) {
    const affiliations = [...(base.affiliations ?? []), ...(filler.affiliations ?? [])];
    const affiliationLookup: Record<string, Affiliation> = {};
    affiliations.forEach((aff) => {
      if (!aff.id || isStashPlaceholder(aff)) return;
      if (!affiliationLookup[aff.id]) {
        affiliationLookup[aff.id] = aff;
      } else if (normalizeJsonToString(aff) !== normalizeJsonToString(affiliationLookup[aff.id])) {
        validationWarning(
          `Duplicate affiliation id within project: ${aff.id}`,
          incrementOptions('affiliations', opts),
        );
      }
    });
    frontmatter.affiliations = [...affiliationIds].map((id) => {
      return affiliationLookup[id] ?? stashPlaceholder(id);
    });
  }

  return frontmatter;
}

export function fillProjectFrontmatter(
  base: ProjectFrontmatter,
  filler: ProjectFrontmatter,
  opts: ValidationOptions,
  keys?: string[],
  trimUnused?: boolean,
) {
  const frontmatter: ProjectFrontmatter = fillSiteFrontmatter(
    base,
    filler,
    opts,
    keys ?? Object.keys(filler),
    trimUnused,
  );

  if (filler.numbering || base.numbering) {
    frontmatter.numbering = fillNumbering(base.numbering, filler.numbering);
  }

  // Combine all math macros defined on page and project
  if (filler.math || base.math) {
    frontmatter.math = { ...(filler.math ?? {}), ...(base.math ?? {}) };
  }

  // Combine all abbreviation defined on page and project
  if (filler.abbreviations || base.abbreviations) {
    frontmatter.abbreviations = {
      ...(filler.abbreviations ?? {}),
      ...(base.abbreviations ?? {}),
    };
  }

  // Combine all settings defined on page and project
  if (filler.settings || base.settings) {
    frontmatter.settings = {
      ...(filler.settings ?? {}),
      ...(base.settings ?? {}),
    };
  }

  if (filler.identifiers || base.identifiers) {
    frontmatter.identifiers = {
      ...(filler.identifiers ?? {}),
      ...(base.identifiers ?? {}),
    };
  }

  if (!trimUnused) {
    if (filler.bibliography || base.bibliography) {
      frontmatter.bibliography = [
        ...new Set([...(filler.bibliography ?? []), ...(base.bibliography ?? [])]),
      ];
    }
    if (filler.requirements || base.requirements) {
      frontmatter.requirements = [
        ...new Set([...(filler.requirements ?? []), ...(base.requirements ?? [])]),
      ];
    }
    if (filler.resources || base.resources) {
      frontmatter.resources = [
        ...new Set([...(filler.resources ?? []), ...(base.resources ?? [])]),
      ];
    }
    if (filler.exports || base.exports) {
      frontmatter.exports = [];
      const ids = base.exports?.map(({ id }) => id) ?? [];
      filler.exports?.forEach((exp) => {
        if (!exp.id || !ids.includes(exp.id)) {
          frontmatter.exports?.push(exp);
        }
      });
      frontmatter.exports?.push(...(base.exports ?? []));
    }
    if (filler.downloads || base.downloads) {
      frontmatter.downloads = [];
      const ids = base.downloads?.map(({ id }) => id).filter(Boolean) ?? [];
      const urls = base.downloads?.map(({ url }) => url).filter(Boolean) ?? [];
      filler.downloads?.forEach((download) => {
        if (download.id && !ids.includes(download.id)) {
          frontmatter.downloads?.push(download);
        }
        if (download.url && !urls.includes(download.url)) {
          frontmatter.downloads?.push(download);
        }
      });
      frontmatter.downloads?.push(...(base.downloads ?? []));
    }
  }

  return frontmatter;
}
