import type { GenericNode } from 'mystjs';
import { remove, selectAll } from 'mystjs';
import type { Root } from '../myst';
import { transformKeys } from './keys';
import type { References } from './types';

export function transformFootnotes(mdast: Root, references: References) {
  const footnotes = selectAll('footnoteDefinition', mdast);
  references.footnotes = Object.fromEntries(
    footnotes.map((n: GenericNode) => [n.identifier, transformKeys(n)]),
  );
  remove(mdast, 'footnoteDefinition');
}
