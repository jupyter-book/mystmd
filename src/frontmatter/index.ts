import yaml from 'js-yaml';
import { join } from 'path';
import { Root, PhrasingContent } from 'mdast';
import { GenericNode, select } from 'mystjs';
import { CURVENOTE_YML } from '../config/types';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { PageFrontmatter } from './types';
import {
  validatePageFrontmatter,
  validateProjectFrontmatter,
  fillPageFrontmatter,
} from './validators';

function toText(content: PhrasingContent[]): string {
  return content
    .map((n) => {
      if ('value' in n) return n.value;
      if ('children' in n) return toText(n.children);
      return '';
    })
    .join('');
}

function frontmatterFromMdastTree(
  tree: Root,
  remove = true,
): { tree: Root; frontmatter: Record<string, any> } {
  const firstNode = tree.children[0];
  const secondNode = tree.children[1];
  let removeUpTo = 0;
  let frontmatter: Record<string, any> = {};
  const firstIsYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (firstIsYaml) {
    frontmatter = yaml.load(firstNode.value) as Record<string, any>;
    removeUpTo += 1;
  }
  const nextNode = firstIsYaml ? secondNode : firstNode;
  const nextNodeIsHeading = nextNode?.type === 'heading' && nextNode.depth === 1;
  if (nextNodeIsHeading) {
    frontmatter.title = toText(nextNode.children);
    removeUpTo += 1;
  }
  if (remove) tree.children.splice(0, removeUpTo);
  if (!frontmatter.title) {
    const heading = select('heading', tree) as GenericNode;
    // TODO: Improve title selection!
    frontmatter.title = heading?.children?.[0]?.value;
  }
  return { tree, frontmatter };
}

/**
 * Get page frontmatter from mdast tree and fill in missing info from project frontmatter
 *
 * @param session
 * @param path - project path for loading project config/frontmatter
 * @param tree - mdast tree already loaded from 'file'
 * @param file - file source for mdast 'tree' - this is only used for logging; tree is not reloaded
 * @param remove - if true, mdast tree will be mutated to remove frontmatter once read
 */
export function getPageFrontmatter(
  session: ISession,
  path: string,
  tree: Root,
  file: string,
  remove = true,
): PageFrontmatter {
  const { frontmatter: rawPageFrontmatter } = frontmatterFromMdastTree(tree, remove);
  const pageFrontmatter = validatePageFrontmatter(rawPageFrontmatter, {
    logger: session.log,
    property: 'frontmatter',
    file,
    count: {},
  });

  const state = session.store.getState();
  const projConfig = selectors.selectLocalProjectConfig(state, path) ?? {};
  // Validation happens on initial read; this is called for filtering/coersion only.
  const projectFrontmatter = validateProjectFrontmatter(projConfig, {
    logger: session.log,
    property: 'project',
    file: join(path, CURVENOTE_YML),
    suppressWarnings: true,
    count: {},
  });

  const frontmatter = fillPageFrontmatter(pageFrontmatter, projectFrontmatter);

  const site = selectors.selectLocalSiteConfig(state);
  if (site?.design?.hide_authors) {
    delete frontmatter.authors;
  }
  return frontmatter;
}
