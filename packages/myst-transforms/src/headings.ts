import type { Plugin } from 'unified';
import { fileWarn, type GenericParent } from 'myst-common';
import type { Heading } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

type HeadingDepthOptions = { titleDepth?: number };

/**
 * Modify heading depths based on heading depth map
 *
 * The map is a list where depths in the tree are converted to the value
 * at that one-based index.
 *
 * If no map is provided, this will normalize heading depths to eliminate
 * skipped values, i.e. lowest existing heading depth will become 1, next
 * will become 2, etc.
 *
 * This also does not take into account lifting title from heading to frontmatter;
 * any transformation there must be complete prior to this transform.
 */
export async function headingDepthTransform(
  tree: GenericParent,
  vfile: VFile,
  opts?: HeadingDepthOptions,
) {
  const titleDepth = opts?.titleDepth && opts.titleDepth > 0 ? opts.titleDepth : 0;
  const headings = selectAll('heading', tree) as Heading[];
  if (headings.length === 0) return;
  const currentDepths = [
    ...new Set(headings.map((heading) => heading.depth).filter((depth) => !!depth)),
  ].sort();
  for (let i = currentDepths[0] + 1; i < currentDepths[currentDepths.length - 1]; i++) {
    if (!currentDepths.includes(i)) {
      fileWarn(vfile, `missing heading depth ${i}`);
    }
  }
  if (currentDepths.length + titleDepth > 6) {
    fileWarn(vfile, `max number of heading depth levels exceeded; must be < ${7 - titleDepth}`);
  }
  headings.forEach((heading) => {
    const depthIndex = currentDepths.indexOf(heading.depth);
    if (depthIndex < 0) return;
    const newDepth = depthIndex + 1 + titleDepth;
    heading.depth = newDepth < 7 ? newDepth : 6;
  });
}

export const headingDepthPlugin: Plugin<[HeadingDepthOptions], GenericParent, GenericParent> =
  (opts) => (tree, vfile) => {
    headingDepthTransform(tree, vfile, opts);
  };
