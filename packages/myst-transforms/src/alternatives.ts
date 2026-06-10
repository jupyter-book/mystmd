import type { Plugin } from 'unified';
import type { Alternatives } from 'myst-spec-ext';
import type { VFile } from 'vfile';
import { selectAll, matches } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { RuleId, fileError } from 'myst-common';

/**
 * Validate alternatives
 */
export function validateAlternativesTransform(tree: GenericParent, vfile: VFile) {
  const alternatives = selectAll('alternatives', tree) as Alternatives[];
  alternatives.forEach((node) => {
    for (const child of node.children) {
      if (!matches('image,anywidget', child)) {
        fileError(vfile, 'alternatives has unsupported child', {
          node,
          ruleId: RuleId.containerChildrenValid,
        });
      }
    }
  });
}

export const validateAlternativesPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, vfile) => {
    validateAlternativesTransform(tree, vfile);
  };
