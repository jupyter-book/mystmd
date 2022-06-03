import { PartialProject, Project } from '@curvenote/blocks';
import { ISession } from '../session';
import { filterKeys } from '../utils/validators';
import { Author, ProjectFrontmatter } from './types';
import { PROJECT_FRONTMATTER_KEYS, validateProjectFrontmatterKeys } from './validators';

function resolveAffiliations(author: Author, projectAffiliations: Project['affiliations']): Author {
  const affiliationLookup = Object.fromEntries(
    projectAffiliations.map((val) => [val.id, val.text]),
  );
  const { affiliations, ...rest } = author;
  if (!affiliations) return { ...rest };
  const resolvedAffiliations = affiliations
    .map((val) => affiliationLookup[val])
    .filter((val) => val);
  return { affiliations: resolvedAffiliations, ...rest };
}

export function projectFrontmatterFromDTO(
  session: ISession,
  project: PartialProject,
): ProjectFrontmatter {
  const apiFrontmatter = filterKeys(project, PROJECT_FRONTMATTER_KEYS);
  const affiliations = project.affiliations || [];
  if (apiFrontmatter.authors) {
    apiFrontmatter.authors = apiFrontmatter.authors.map((author: Author) =>
      resolveAffiliations(author, affiliations),
    );
  }
  if (project.licenses) {
    apiFrontmatter.license = project.licenses;
  }
  return validateProjectFrontmatterKeys(apiFrontmatter, {
    logger: session.log,
    property: 'project',
    suppressErrors: true,
    suppressWarnings: true,
    count: {},
  });
}
