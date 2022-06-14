import { Block, oxaLink, Project } from '@curvenote/blocks';
import { affiliations } from '../store/local';
import { selectAffiliation } from '../store/selectors';
import { ISession } from '../session';
import { filterKeys, Options } from '../utils/validators';
import { Author, PageFrontmatter, ProjectFrontmatter } from './types';
import {
  PAGE_FRONTMATTER_KEYS,
  PROJECT_FRONTMATTER_KEYS,
  validatePageFrontmatterKeys,
  validateProjectFrontmatterKeys,
} from './validators';

export function saveAffiliations(session: ISession, project: Project) {
  session.store.dispatch(
    affiliations.actions.receive({
      affiliations: project.affiliations || [],
    }),
  );
}

function resolveAffiliations(session: ISession, author: Author): Author {
  const { affiliations: authorAffiliations, ...rest } = author;
  if (!authorAffiliations) return { ...rest };
  const state = session.store.getState();
  const resolvedAffiliations = authorAffiliations
    .map((id) => selectAffiliation(state, id))
    .filter((text): text is string => typeof text === 'string');
  return { affiliations: resolvedAffiliations, ...rest };
}

export function projectFrontmatterFromDTO(
  session: ISession,
  project: Project,
  opts?: Partial<Options>,
): ProjectFrontmatter {
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
    ...opts,
  });
}

export function pageFrontmatterFromDTO(
  session: ISession,
  block: Block,
  date?: string | Date,
  opts?: Partial<Options>,
): PageFrontmatter {
  const apiFrontmatter = filterKeys(block, PAGE_FRONTMATTER_KEYS);
  if (apiFrontmatter.authors) {
    apiFrontmatter.authors = apiFrontmatter.authors.map((author: Author) =>
      resolveAffiliations(session, author),
    );
  }
  if (block.licenses) {
    apiFrontmatter.license = block.licenses;
  }
  // TODO: Date needs to be in block frontmatter
  if (block.date_modified) {
    apiFrontmatter.date = date || block.date_modified;
  }
  apiFrontmatter.oxa = oxaLink('', block.id);
  return validatePageFrontmatterKeys(apiFrontmatter, {
    logger: session.log,
    property: 'page',
    suppressErrors: true,
    suppressWarnings: true,
    count: {},
    ...opts,
  });
}
