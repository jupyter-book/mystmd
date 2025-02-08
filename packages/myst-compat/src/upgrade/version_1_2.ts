import type { Parent } from 'mdast';
import type {
  FootnoteDefinition as FootnoteDefinition2,
  FootnoteReference as FootnoteReference2,
} from '../types/v2.js';
import type {
  FootnoteDefinition as FootnoteDefinition1,
  FootnoteReference as FootnoteReference1,
} from '../types/v1.js';
import { visit, CONTINUE, SKIP } from 'unist-util-visit';

export function upgrade(ast: Parent) {
  // Walk over footnote nodes
  visit(
    ast as any,
    ['footnoteDefinition', 'footnoteReference'],
    (
      node: FootnoteDefinition1 | FootnoteReference1,
      index: number | null,
      parent: Parent | null,
    ) => {
      if (parent) {
        switch (node.type) {
          case 'footnoteDefinition': {
            const { number, ...rest } = node;
            const nextNode: FootnoteDefinition2 = {
              ...rest,
              enumerator: number ? String(number) : undefined,
            };
            parent.children[index!] = nextNode as any;
            return CONTINUE;
          }
          case 'footnoteReference': {
            const { number, ...rest } = node;
            const nextNode: FootnoteReference2 = {
              ...rest,
              enumerator: number ? String(number) : undefined,
            };
            parent.children[index!] = nextNode as any;
            return SKIP;
          }
        }
      }
    },
  );
}
