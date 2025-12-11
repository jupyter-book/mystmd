import type { Plugin } from 'unified';
import type { Node } from 'myst-spec';
import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { normalizeLabel, toText, fileError, RuleId } from 'myst-common';

export function glossaryTransform<T extends Node | GenericParent>(mdast: T, file: VFile) {
  const glossaries = selectAll('glossary', mdast) as GenericParent[];
  glossaries.forEach((glossary) => {
    glossary.children.forEach((list) => {
      if (list.type !== 'definitionList') {
        fileError(
          file,
          'Unexpected node as a child of a glossary, expected only `definitionList` children',
          {
            node: list,
            ruleId: RuleId.glossaryUsesDefinitionList,
          },
        );
        return;
      }
      list.children?.forEach((child) => {
        if (child.type === 'definitionTerm') {
          const { label, identifier, html_id } = normalizeLabel(toText(child)) ?? {};
          child.label = label;
          child.identifier = `term-${identifier}`;
          child.html_id = `term-${html_id}`;
          child.indexEntries = [{ entry: toText(child) }];
        }
      });
    });
  });
}

export const glossaryPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree, file) => {
  glossaryTransform(tree, file);
};
