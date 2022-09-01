import yaml from 'js-yaml';
import { select } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import type { Root } from 'mdast';
import type { Code, Heading } from 'myst-spec';
import { toText } from 'myst-utils';

type Options = {
  removeYaml?: boolean;
  removeHeading?: boolean;
};

export function getFrontmatter(
  tree: Root,
  opts: Options = { removeYaml: true, removeHeading: true },
): { tree: Root; frontmatter: Record<string, any> } {
  const firstNode = tree.children[0] as Code;
  const secondNode = tree.children[1] as Heading;
  let frontmatter: Record<string, any> = {};
  const firstIsYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (firstIsYaml) {
    frontmatter = yaml.load(firstNode.value) as Record<string, any>;
    if (opts.removeYaml) (firstNode as any).type = '__delete__';
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
      if (opts.removeHeading) (nextNode as any).type = '__delete__';
    }
  }
  if (!frontmatter.title) {
    const heading = select('heading', tree) as Heading;
    if (heading) {
      frontmatter.title = toText(heading.children);
      if (opts.removeHeading) (heading as any).type = '__delete__';
    }
  }
  if (opts.removeHeading || opts.removeYaml) {
    // Handles deleting the block if it is the only element in the block
    const possibleNull = remove(tree, '__delete__');
    if (possibleNull === null) {
      // null is returned if tree itself didn’t pass the test or is cascaded away
      remove(tree, { cascade: false }, '__delete__');
    }
  }
  return { tree, frontmatter };
}
