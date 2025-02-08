import type { Parent } from 'mdast';
import type {
  FootnoteDefinition as FootnoteDefinition2,
  FootnoteReference as FootnoteReference2,
  IFile as IFile2,
} from '../types/v2.js';
import type {
  FootnoteDefinition as FootnoteDefinition1,
  FootnoteReference as FootnoteReference1,
} from '../types/v1.js';
import { visit, CONTINUE, SKIP } from 'unist-util-visit';

function maybeParseInt(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const result = parseInt(value);
  if (String(result) === value) {
    return result;
  } else {
    return undefined;
  }
}

export function downgrade(file: IFile2) {
  const { mdast } = file;
  // Walk over footnote nodes
  visit(
    mdast as any,
    ['footnoteDefinition', 'footnoteReference'],
    (
      node: FootnoteDefinition2 | FootnoteReference2,
      index: number | null,
      parent: Parent | null,
    ) => {
      if (parent) {
        switch (node.type) {
          case 'footnoteDefinition': {
            const { enumerator, ...rest } = node;
            const nextNode: FootnoteDefinition1 = rest;
            const maybeNumber = maybeParseInt(enumerator);
            if (maybeNumber !== undefined) {
              nextNode.number = maybeNumber;
            }
            parent.children[index!] = nextNode as any;
            return CONTINUE;
          }
          case 'footnoteReference': {
            const { enumerator, ...rest } = node;
            const nextNode: FootnoteReference1 = rest;
            const maybeNumber = maybeParseInt(enumerator);
            if (maybeNumber !== undefined) {
              nextNode.number = maybeNumber;
            }
            parent.children[index!] = nextNode as any;
            return SKIP;
          }
        }
      }
    },
  );
}
