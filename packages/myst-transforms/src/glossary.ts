import type { Plugin } from 'unified';
import type { Node } from 'myst-spec';
import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { normalizeLabel, toText, fileError } from 'myst-common';
import type { IReferenceState } from './enumerate.js';

export type Options = {
  state: IReferenceState;
};

export function glossaryTransform<T extends Node | GenericParent>(
  mdast: T,
  file: VFile,
  opts: Options,
) {
  const glossaries = selectAll('glossary', mdast) as GenericParent[];
  glossaries.forEach((glossary) => {
    glossary.children.forEach((list) => {
      if (list.type !== 'definitionList') {
        fileError(
          file,
          'Unexpected node as a child of a glossary, expected only `definitionList` children',
          {
            node: list,
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
        }
      });
    });
  });
}

export const glossaryPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => (tree, file) => {
    glossaryTransform(tree, file, opts);
  };
