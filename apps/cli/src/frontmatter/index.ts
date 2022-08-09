import type { Root } from 'mdast';
import { getFrontmatter } from 'myst-transforms';
import type { Licenses } from '../licenses/types';
import { licensesToString } from '../licenses/validators';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import type { PageFrontmatter } from './types';
import { validatePageFrontmatter, fillPageFrontmatter } from './validators';

/**
 * Unnest `kernelspec` from `jupyter.kernelspec`
 */
export function unnestKernelSpec(pageFrontmatter: Record<string, any>) {
  if (pageFrontmatter.jupyter?.kernelspec) {
    // TODO: When we are exporting from local state, we will need to be more careful to
    // round-trip this correctly.
    pageFrontmatter.kernelspec = pageFrontmatter.jupyter.kernelspec;
    // This cleanup prevents warning on `jupyter.kernelspec` but keeps warnings if other
    // keys exist under `jupyter`
    delete pageFrontmatter.jupyter.kernelspec;
    if (!Object.keys(pageFrontmatter.jupyter).length) {
      delete pageFrontmatter.jupyter;
    }
  }
}

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
    logger: session.log,
    property: 'frontmatter',
    file,
    count: {},
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
