import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import type { FootnoteDefinition as FND, FootnoteReference as FNR } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import { keysTransform } from './keys';
import type { References } from './types';
import { fileWarn } from 'myst-common';

type Options = {
  references: Pick<References, 'footnotes'>;
};

type FootnoteDefinition = FND & {
  number?: number;
};

type FootnoteReference = FNR & {
  number?: number;
};

function nextNumber(current: number, reserved: Set<number>): number {
  do {
    current += 1;
  } while (reserved.has(current));
  return current;
}

const TRANSFORM_SOURCE = 'myst-transforms:footnotes';

export function footnotesTransform(mdast: Root, file: VFile, opts: Options) {
  const footnotes = selectAll('footnoteDefinition', mdast) as FootnoteDefinition[];
  opts.references.footnotes = Object.fromEntries(
    footnotes.map((n) => {
      // Clear out the number
      delete n.number;
      return [n.identifier, keysTransform(n)];
    }),
  );
  remove(mdast, 'footnoteDefinition');
  const references = selectAll('footnoteReference', mdast) as FootnoteReference[];
  const reserved = new Set(
    references.map((r) => Number(r.identifier)).filter((num) => !Number.isNaN(num) && num > 0),
  );
  let footnoteCount = 0;
  references.forEach((node) => {
    if (!node.identifier) {
      fileWarn(file, 'FootnoteReference does not have an identifier', {
        node,
        source: TRANSFORM_SOURCE,
      });
      return;
    }
    const def = opts.references.footnotes?.[node.identifier] as FootnoteDefinition | undefined;
    if (!def) {
      fileWarn(file, `No footnoteDefinition found for ${node.identifier}`, {
        node,
        source: TRANSFORM_SOURCE,
      });
      return;
    }
    const identifierNumber = Number(node.identifier);
    if (!Number.isNaN(identifierNumber) && identifierNumber > 0) {
      def.number = identifierNumber;
      node.number = identifierNumber;
    } else {
      footnoteCount = nextNumber(footnoteCount, reserved);
      def.number = footnoteCount;
      node.number = footnoteCount;
    }
  });
}

export const footnotesPlugin: Plugin<[Options], Root, Root> = (opts) => (tree, file) => {
  footnotesTransform(tree, file, opts);
};
