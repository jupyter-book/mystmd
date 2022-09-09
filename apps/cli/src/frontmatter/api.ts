import type { Block, Project } from '@curvenote/blocks';
import { oxaLink } from '@curvenote/blocks';
import type { Author, PageFrontmatter, ProjectFrontmatter } from '@curvenote/frontmatter';
import {
  PAGE_FRONTMATTER_KEYS,
  PROJECT_FRONTMATTER_KEYS,
  validatePageFrontmatterKeys,
  validateProjectFrontmatterKeys,
} from '@curvenote/frontmatter';
import type { ValidationOptions } from '@curvenote/validators';
import { filterKeys } from '@curvenote/validators';
import { dirname, join } from 'path';
import { affiliations } from '../store/local';
import { selectAffiliation } from '../store/selectors';
import type { ISession } from '../session';
import { downloadAndSaveImage } from '../transforms/images';
import { THUMBNAILS_FOLDER } from '../utils';

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
  opts?: Partial<ValidationOptions>,
): ProjectFrontmatter {
  const apiFrontmatter = filterKeys(project, PROJECT_FRONTMATTER_KEYS) as ProjectFrontmatter;
  if (apiFrontmatter.authors) {
    apiFrontmatter.authors = apiFrontmatter.authors.map((author: Author) =>
      resolveAffiliations(session, author),
    );
  }
  if (project.licenses) {
    // This will get validated below
    apiFrontmatter.license = project.licenses as any;
  }
  return validateProjectFrontmatterKeys(apiFrontmatter, {
    property: 'project',
    suppressErrors: true,
    suppressWarnings: true,
    messages: {},
    ...opts,
  });
}

export async function pageFrontmatterFromDTOAndThumbnail(
  session: ISession,
  filename: string,
  block: Block,
  date?: string | Date,
  opts?: Partial<ValidationOptions>,
): Promise<PageFrontmatter> {
  const apiFrontmatter = pageFrontmatterFromDTO(session, block, date, opts);
  if (block.links.thumbnail) {
    const result = await downloadAndSaveImage(
      session,
      block.links.thumbnail,
      block.name || block.id.block,
      join(dirname(filename), THUMBNAILS_FOLDER),
    );
    if (result) {
      apiFrontmatter.thumbnail = join(THUMBNAILS_FOLDER, result);
    }
  }
  return apiFrontmatter;
}

export function pageFrontmatterFromDTO(
  session: ISession,
  block: Block,
  date?: string | Date,
  opts?: Partial<ValidationOptions>,
): PageFrontmatter {
  const apiFrontmatter = filterKeys(block, PAGE_FRONTMATTER_KEYS) as PageFrontmatter;
  if (apiFrontmatter.authors) {
    apiFrontmatter.authors = apiFrontmatter.authors.map((author: Author) =>
      resolveAffiliations(session, author),
    ) as any;
  }
  if (block.licenses) {
    apiFrontmatter.license = block.licenses as any;
  }
  // TODO: Date needs to be in block frontmatter
  if (block.date_modified) {
    apiFrontmatter.date = (date || block.date_modified) as any;
  }
  apiFrontmatter.oxa = oxaLink('', block.id) as any;
  return validatePageFrontmatterKeys(apiFrontmatter, {
    property: 'page',
    suppressErrors: true,
    suppressWarnings: true,
    messages: {},
    ...opts,
  });
}
