import type { Root } from 'mdast';
import { getFrontmatter } from 'myst-transforms';
import type { Licenses, PageFrontmatter } from '@curvenote/frontmatter';
import {
  fillPageFrontmatter,
  licensesToString,
  unnestKernelSpec,
  validatePageFrontmatter,
} from '@curvenote/frontmatter';
import type { ISession } from '../session/types';
import { selectors } from '../store';

/**
 * Get page frontmatter from mdast tree and fill in missing info from project frontmatter
 *
 * @param session
 * @param path - project path for loading project config/frontmatter
 * @param tree - mdast tree already loaded from 'file'
 * @param file - file source for mdast 'tree' - this is only used for logging; tree is not reloaded
 * @param removeNode - if true, mdast tree will be mutated to remove frontmatter once read
 */
export function getPageFrontmatter(
  session: ISession,
  tree: Root,
  file: string,
  path?: string,
  removeNode = true,
): PageFrontmatter {
  const { frontmatter: rawPageFrontmatter } = getFrontmatter(tree, {
    removeYaml: removeNode,
    removeHeading: removeNode,
  });
  unnestKernelSpec(rawPageFrontmatter);
  const pageFrontmatter = validatePageFrontmatter(rawPageFrontmatter, {
    property: 'frontmatter',
    file,
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: "${message}"`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: "${message}"`);
    },
  });

  const state = session.store.getState();
  const siteFrontmatter = selectors.selectLocalSiteConfig(state) ?? {};
  const projectFrontmatter = path ? selectors.selectLocalProjectConfig(state, path) ?? {} : {};

  const frontmatter = fillPageFrontmatter(pageFrontmatter, projectFrontmatter, siteFrontmatter);

  const site = selectors.selectLocalSiteConfig(state);
  if (site?.design?.hide_authors) {
    delete frontmatter.authors;
  }
  return frontmatter;
}

export function prepareToWrite(frontmatter: { license?: Licenses }) {
  if (!frontmatter.license) return { ...frontmatter };
  return { ...frontmatter, license: licensesToString(frontmatter.license) };
}
