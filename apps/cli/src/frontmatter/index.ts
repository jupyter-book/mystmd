import yaml from 'js-yaml';
import type { Root, Code, Heading } from 'mdast';
import { remove, select } from 'mystjs';
import type { Licenses } from '../licenses/types';
import { licensesToString } from '../licenses/validators';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { toText } from '../utils';
import type { PageFrontmatter } from './types';
import { validatePageFrontmatter, fillPageFrontmatter } from './validators';

export function frontmatterFromMdastTree(
  tree: Root,
  removeNode = true,
): { tree: Root; frontmatter: Record<string, any> } {
  const firstNode = tree.children[0] as Code;
  const secondNode = tree.children[1] as Heading;
  let frontmatter: Record<string, any> = {};
  const firstIsYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (firstIsYaml) {
    frontmatter = yaml.load(firstNode.value) as Record<string, any>;
    if (removeNode) (firstNode as any).type = '__delete__';
  }
  const nextNode = firstIsYaml ? secondNode : (firstNode as unknown as Heading);
  const nextNodeIsHeading = nextNode?.type === 'heading' && nextNode.depth === 1;
  // Explicitly handle the case of a H1 directly after the frontmatter
  if (nextNodeIsHeading) {
    const title = toText(nextNode.children);
    // Add the title if it doesn't already exist
    if (!frontmatter.title) frontmatter.title = title;
    // Only remove the title if it is the same
    if (frontmatter.title && frontmatter.title === title) {
      if (removeNode) (nextNode as any).type = '__delete__';
    }
  }
  if (!frontmatter.title) {
    const heading = select('heading', tree) as Heading;
    if (heading) {
      frontmatter.title = toText(heading.children);
      if (removeNode) (heading as any).type = '__delete__';
    }
  }
  if (removeNode) {
    // Handles deleting the block if it is the only element in the block
    const possibleNull = remove(tree, '__delete__');
    if (possibleNull === null) {
      // null is returned if tree itself didn’t pass the test or is cascaded away
      remove(tree, { cascade: false }, '__delete__');
    }
  }
  return { tree, frontmatter };
}

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
  path: string,
  tree: Root,
  file: string,
  removeNode = true,
): PageFrontmatter {
  const { frontmatter: rawPageFrontmatter } = frontmatterFromMdastTree(tree, removeNode);
  unnestKernelSpec(rawPageFrontmatter);
  const pageFrontmatter = validatePageFrontmatter(rawPageFrontmatter, {
    logger: session.log,
    property: 'frontmatter',
    file,
    count: {},
  });

  const state = session.store.getState();
  const siteFrontmatter = selectors.selectLocalSiteConfig(state) ?? {};
  const projectFrontmatter = selectors.selectLocalProjectConfig(state, path) ?? {};

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
