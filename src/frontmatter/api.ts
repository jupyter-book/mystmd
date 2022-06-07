import { PartialProject, Project } from '@curvenote/blocks';
import { ISession } from '../session';
import { filterKeys } from '../utils/validators';
import { Author, ProjectFrontmatter } from './types';
import { PROJECT_FRONTMATTER_KEYS, validateProjectFrontmatterKeys } from './validators';

function resolveAffiliations(session: ISession, author: Author): Author {
  const { affiliations, ...rest } = author;
  if (!affiliations) return { ...rest };
  const state = session.store.getState();
  const resolvedAffiliations = affiliations
    .map((id) => selectAffiliation(state, id))
    .filter((text): text is string => typeof text === 'string');
  return { affiliations: resolvedAffiliations, ...rest };
}

export function projectFrontmatterFromDTO(session: ISession, project: Project): ProjectFrontmatter {
  const apiFrontmatter = filterKeys(project, PROJECT_FRONTMATTER_KEYS);
  if (apiFrontmatter.authors) {
    apiFrontmatter.authors = apiFrontmatter.authors.map((author: Author) =>
      resolveAffiliations(session, author),
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
