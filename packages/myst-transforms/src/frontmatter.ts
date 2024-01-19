import yaml from 'js-yaml';
import { remove } from 'unist-util-remove';
import { select } from 'unist-util-select';
import type { Block, Code, Heading } from 'myst-spec';
import type { GenericParent } from 'myst-common';
import { RuleId, fileError, toText, fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import { mystTargetsTransform } from './targets.js';

type Options = {
  /**
   * In many existing JupyterBooks, the first node is a label `(heading)=`
   * The `propagateTargets` option merges the target with the heading
   * so the title can be picked up by the frontmatter.
   */
  propagateTargets?: boolean;
};

export function getFrontmatter(
  file: VFile,
  tree: GenericParent,
  opts: Options = { propagateTargets: true },
): { tree: GenericParent; frontmatter: Record<string, any> } {
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
      (firstNode as any).type = '__delete__';
    } catch (err) {
      fileError(file, 'Invalid YAML frontmatter', {
        note: (err as Error).message,
        ruleId: RuleId.frontmatterIsYaml,
      });
    }
  }
  if (frontmatter.title === null) {
    if (frontmatter.content_includes_title === false) {
      fileWarn(file, 'frontmatter title cannot be `null` if content_includes_title is false');
    } else {
      frontmatter.content_includes_title = true;
    }
    delete frontmatter.title;
  }
  const explicitContentIncludesTitle = frontmatter.content_includes_title;
  const firstHeadingNode = select('heading', tree) as Heading;
  // If title is not defined, copy first header to title
  if (!frontmatter.title && firstHeadingNode) {
    const title = toText(firstHeadingNode.children);
    frontmatter.title = title;
    frontmatter.content_includes_title = true;
  }
  const nextNode = firstIsYaml ? secondNode : (firstNode as unknown as Heading);
  const nextNodeIsH1 = nextNode?.type === 'heading' && nextNode.depth === 1;
  // Explicitly handle the case of an H1 directly after the frontmatter
  if (nextNodeIsH1 && !explicitContentIncludesTitle) {
    const title = toText(nextNode.children);
    // Only remove the title if it is the same
    if (frontmatter.title && frontmatter.title === title) {
      // If this has a label what do we do? Add this label as a document reference
      (nextNode as any).type = '__delete__';
      frontmatter.content_includes_title = false;
    }
  }
  // Handles deleting the block if it is the only element in the block
  const possibleNull = remove(tree, '__delete__');
  if (possibleNull === null) {
    // null is returned if tree itself didn’t pass the test or is cascaded away
    remove(tree, { cascade: false }, '__delete__');
  }
  return { tree, frontmatter };
}
