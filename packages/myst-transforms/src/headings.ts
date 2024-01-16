import type { Plugin } from 'unified';
import type { GenericParent } from 'myst-common';
import type { Heading } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';

const VALID_HEADING_DEPTHS = [1, 2, 3, 4, 5, 6];

/**
 * Sorted list of heading depth values
 */
export function mapFromHeadingDepths(depths: number[]) {
  return VALID_HEADING_DEPTHS.map((d) => {
    return depths.indexOf(d) + 1;
  });
}

type HeadingDepthOptions = { headingDepthMap?: number[] };

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
export async function headingDepthTransform(tree: GenericParent, opts?: HeadingDepthOptions) {
  const headings = selectAll('heading', tree) as Heading[];
  let headingDepthMap = opts?.headingDepthMap;
  if (!headingDepthMap) {
    const currentDepths = [...new Set(headings.map((heading) => heading.depth))].sort();
    headingDepthMap = mapFromHeadingDepths(currentDepths);
  }
  headings.forEach((heading) => {
    const newDepth = headingDepthMap?.[heading.depth - 1];
    if (newDepth && VALID_HEADING_DEPTHS.includes(newDepth)) {
      heading.depth = newDepth as number;
    }
  });
}

export const headingDepthPlugin: Plugin<[HeadingDepthOptions], GenericParent, GenericParent> =
  (opts) => (tree) => {
    headingDepthTransform(tree, opts);
  };
