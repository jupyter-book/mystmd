import yaml from 'js-yaml';
import { Root, PhrasingContent } from 'mdast';
import { GenericNode, select } from 'mystjs';

export type Frontmatter = {
  title?: string;
  description?: string;
} & Record<string, string>;

function toText(content: PhrasingContent[]): string {
  return content
    .map((n) => {
      if ('value' in n) return n.value;
      if ('children' in n) return toText(n.children);
      return '';
    })
    .join('');
}

export function getFrontmatter(tree: Root, remove = true): Frontmatter {
  const firstNode = tree.children[0];
  const secondNode = tree.children[1];
  let removeUpTo = 0;
  let frontmatter: Frontmatter = {};
  const isYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (isYaml) {
    frontmatter = yaml.load(firstNode.value) as Record<string, any>;
    removeUpTo += 1;
  }
  const maybeHeading = isYaml ? secondNode : firstNode;
  const isHeading = maybeHeading?.type === 'heading' && maybeHeading.depth === 1;
  if (isHeading) {
    frontmatter.title = toText(maybeHeading.children);
    removeUpTo += 1;
  }
  if (remove) tree.children.splice(0, removeUpTo);
  if (!frontmatter.title) {
    const heading = select('heading', tree) as GenericNode;
    // TODO: Improve title selection!
    frontmatter.title = heading?.children?.[0]?.value || 'Untitled';
  }
  return frontmatter;
}
