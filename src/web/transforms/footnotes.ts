import { GenericNode, remove, selectAll } from 'mystjs';
import { transformKeys } from './keys';
import { Root, TransformState } from './types';

export function transformFootnotes(mdast: Root, state: TransformState) {
  const footnotes = selectAll('footnoteDefinition', mdast);
  state.references.footnotes = Object.fromEntries(
    footnotes.map((n: GenericNode) => [n.identifier, transformKeys(n)]),
  );
  remove(mdast, 'footnoteDefinition');
}
