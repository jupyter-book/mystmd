import yaml from 'js-yaml';
import { remove } from 'unist-util-remove';
import type { Root } from 'mdast';
import type { Block, Code, Heading } from 'myst-spec';
import { fileError, toText } from 'myst-common';
import { VFile } from 'vfile';
import { mystTargetsTransform } from './targets.js';

type Options = {
  removeYaml?: boolean;
  removeHeading?: boolean;
  /**
   * In many existing JupyterBooks, the first node is a label `(heading)=`
   * The `propagateTargets` option merges the target with the heading
   * so the title can be picked up by the frontmatter.
   */
  propagateTargets?: boolean;
};

export function getFrontmatter(
  file: VFile,
  tree: Root,
  opts: Options = { removeYaml: true, removeHeading: true, propagateTargets: true },
): { tree: Root; frontmatter: Record<string, any> } {
  if (opts.propagateTargets) mystTargetsTransform(tree);
  const firstParent =
    (tree.children[0]?.type as any) === 'block' ? (tree.children[0] as any as Block) : tree;
  const firstNode = firstParent.children?.[0] as Code;
  const secondNode = firstParent.children?.[1] as Heading;
  let frontmatter: Record<string, any> = {};
  const firstIsYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (firstIsYaml) {
    try {
      frontmatter = (yaml.load(firstNode.value) as Record<string, any>) || {};
      if (opts.removeYaml) (firstNode as any).type = '__delete__';
    } catch {
      fileError(file, 'Invalid yaml in first cell of notebook');
    }
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
