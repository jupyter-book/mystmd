import type { GenericNode, GenericParent } from 'myst-common';
import { fileWarn, RuleId } from 'myst-common';
import type { Raw } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { TexParser } from 'tex-to-myst';
import type { PhrasingContent } from 'myst-spec';

export async function rawDirectiveTransform(tree: GenericParent, vfile: VFile) {
  const rawNodes = selectAll('raw', tree) as Raw[];
  rawNodes.forEach((node) => {
    if (!node.value) return;
    if (['latex', 'tex'].includes(node.lang as string)) {
      const state = new TexParser(node.value, vfile);
      (node as GenericNode).children = state.ast.children;
    } else {
      if (node.lang && node.lang !== 'text') {
        fileWarn(vfile, `unknown format for raw content: ${node.lang}`, {
          ruleId: RuleId.directiveArgumentCorrect,
          note: 'Treating content as text',
        });
      }
      node.children = [
        { type: 'paragraph', children: [{ type: 'text', value: node.value }] as PhrasingContent[] },
      ];
    }
  });
}

export const rawDirectivePlugin: Plugin<[], GenericParent, GenericParent> =
  () => async (tree, file) => {
    await rawDirectiveTransform(tree as GenericParent, file);
  };
