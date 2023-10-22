import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import type { CitationRenderer } from 'citation-js-utils';

type CountAndLookup = { count: number; lookup: Record<string, string> };

export type IdInventory = {
  section?: CountAndLookup;
  expression?: CountAndLookup;
  equation?: CountAndLookup;
  figure?: CountAndLookup;
  table?: CountAndLookup;
  code?: CountAndLookup;
  quote?: CountAndLookup;
  cite?: CountAndLookup;
  footnote?: CountAndLookup;
  proof?: CountAndLookup;
};

const CONTAINER_KINDS: (keyof IdInventory)[] = ['figure', 'table', 'code', 'quote'];

function updateInventory(
  node: GenericNode,
  key: keyof IdInventory,
  idPrefix: string | ((count: number) => string),
  inventory: IdInventory,
) {
  const keyInv = inventory[key] ?? { count: 0, lookup: {} };
  keyInv.count += 1;
  const newId =
    typeof idPrefix === 'function' ? idPrefix(keyInv.count) : `${idPrefix}-${keyInv.count}`;
  if (node.identifier) {
    keyInv.lookup[node.identifier] = newId;
  }
  node.identifier = newId;
  inventory[key] = keyInv;
}

/**
 * Traverse mdast tree, find reference targets, and replace them with simple identifiers
 *
 * This builds a map of old identifiers to new identifiers, subsequently used
 * for updating references. Modified nodes include sections, containers,
 * footnotes, inlineExpressions, math, and citations.
 */
export function referenceTargetTransform(
  mdast: GenericParent,
  inventory: IdInventory,
  citations?: CitationRenderer,
) {
  const sections = selectAll('section', mdast) as GenericNode[];
  sections.forEach((sec) => {
    updateInventory(sec, 'section', 'sec', inventory);
  });
  const expressions = selectAll('inlineExpression', mdast) as GenericNode[];
  expressions.forEach((expr) => {
    updateInventory(expr, 'expression', 'expr', inventory);
  });
  const equations = selectAll('math', mdast) as GenericNode[];
  equations.forEach((eq) => {
    updateInventory(eq, 'equation', 'eq', inventory);
  });
  const footnotes = selectAll('footnoteDefinition', mdast) as GenericNode[];
  footnotes.forEach((fn) => {
    updateInventory(fn, 'footnote', 'fn', inventory);
  });
  const proofs = selectAll('proof', mdast) as GenericNode[];
  proofs.forEach((fn) => {
    updateInventory(fn, 'proof', 'stm', inventory);
  });
  const containers = selectAll('container', mdast) as GenericNode[];
  containers.forEach((container) => {
    if (!container.kind || !CONTAINER_KINDS.includes(container.kind as any)) {
      return;
    }
    updateInventory(container, container.kind as keyof IdInventory, container.kind, inventory);
  });
  if (!citations) return;
  const citationIds = Object.keys(citations);
  citationIds.forEach((citationId) => {
    inventory.cite ??= { count: 0, lookup: {} };
    if (!inventory.cite.lookup[citationId]) {
      inventory.cite.count += 1;
      const newId = `ref-${inventory.cite.count}`;
      inventory.cite.lookup[citationId] = newId;
      citations[newId] = citations[citationId];
    }
    delete citations[citationId];
  });
}

/**
 * Use reference lookup from referenceTargetTransform to update cross references
 */
export function referenceResolutionTransform(mdast: GenericParent, inventory: IdInventory) {
  const xrefs = selectAll('crossReference', mdast) as GenericNode[];
  const lookup = {
    ...inventory.section?.lookup,
    ...inventory.expression?.lookup,
    ...inventory.equation?.lookup,
    ...inventory.figure?.lookup,
    ...inventory.table?.lookup,
    ...inventory.code?.lookup,
    ...inventory.quote?.lookup,
    ...inventory.proof?.lookup,
  };
  xrefs.forEach((xref) => {
    if (xref.identifier && lookup[xref.identifier]) {
      xref.identifier = lookup[xref.identifier];
    }
  });
  const supplements = selectAll('supplementaryMaterial', mdast) as GenericNode[];
  supplements.forEach((supp) => {
    if (supp.figIdentifier && lookup[supp.figIdentifier]) {
      supp.figIdentifier = lookup[supp.figIdentifier];
    }
    if (supp.embedIdentifier && lookup[supp.embedIdentifier]) {
      supp.embedIdentifier = lookup[supp.embedIdentifier];
    }
  });
  const footnotes = selectAll('footnoteReference', mdast) as GenericNode[];
  footnotes.forEach((fn) => {
    if (fn.identifier && inventory.footnote?.lookup[fn.identifier]) {
      fn.identifier = inventory.footnote.lookup[fn.identifier];
    }
  });
  const citations = selectAll('cite', mdast) as GenericNode[];
  citations.forEach((cite) => {
    if (cite.label && inventory.cite?.lookup[cite.label]) {
      cite.label = inventory.cite.lookup[cite.label];
    }
  });
}
