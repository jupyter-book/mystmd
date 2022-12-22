import type { GenericNode } from 'myst-common';
import { copyNode } from 'myst-common';
import { selectAll } from 'unist-util-select';

export const phrasingTypes = new Set([
  'paragraph',
  'heading',
  'strong',
  'emphasis',
  'inlineCode',
  'subscript',
  'superscript',
  'smallcaps',
  'link',
  'span',
]);

export const UNHANDLED_ERROR_TEXT = 'Unhandled TEX conversion';

export function originalValue(original: string, node: Pick<GenericNode, 'position'>): string {
  const from = node.position?.start.offset;
  const to = node.position?.end.offset;
  if (from == null || to == null) return '';
  return original.slice(from, to);
}

export function getArguments(
  node: GenericNode,
  type: 'group' | 'argument' | 'implicit',
): GenericNode[] {
  return (
    node.args?.filter((n: GenericNode) => {
      return n.openMark === (type === 'group' ? '{' : type === 'implicit' ? '' : '[');
    }) ?? []
  );
}

export function renderInfoIndex(node: GenericNode, name: string): number {
  return node._renderInfo?.namedArguments?.findIndex((a: string) => a === name);
}

const textOnlyReplacements: Record<string, string> = {
  // quotes
  "''": '”',
  '``': '“',
  // Single quotes (must come after double-quotes)
  "'": '’',
  '`': '‘',
  '---': '—', // must be above the next one
  '--': '–',
  '~': ' ',
};

export function replaceTextValue(value?: string): string {
  if (!value) return '';
  return Object.entries(textOnlyReplacements).reduce((v, [k, r]) => {
    return v.replace(new RegExp(k, 'g'), r);
  }, value);
}

export function texToText(content?: GenericNode[] | GenericNode | string | null): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return texToText([content]);
  return (content as GenericNode[])
    .map((n) => {
      if (n.type === 'whitespace') return ' ';
      if (n.type === 'comment') return '';
      if (n.children) return texToText(n.children);
      if (Array.isArray(n.content)) return texToText(n.content);
      if (Array.isArray(n.args)) return texToText(n.args);
      if (typeof n.content === 'string') return n.content;
      if ('value' in n) return n.value;
      return '';
    })
    .join('');
}

function lastNode(node: GenericNode): GenericNode {
  if (!node) return node;
  if (Array.isArray(node.content)) {
    const last = lastNode(node.content?.[node.content.length - 1]);
    return last;
  }
  if (Array.isArray(node.args)) {
    const lastArg = node.args?.[node.args.length - 1];
    const last = lastNode(lastArg);
    // This is a bit of a hack, we need to put the positions around the arguments
    if (node.type === 'macro' && last.position?.end.offset && lastArg.closeMark.match(/^\}|\]$/)) {
      lastArg.position = {
        ...lastArg.content[0].position,
        end: { ...last.position.end, offset: last.position.end.offset + 1 },
      };
      return lastArg;
    }
    return last;
  }
  const out = copyNode(node);
  return out;
}

export function getPositionExtents(node: GenericNode): GenericNode['position'] {
  const start =
    node.content?.[0]?.position?.start ?? node.content?.[0]?.args?.start ?? node.position?.start;
  const endGroup = node.content?.[node.content.length - 1]?.position?.end;
  const last = lastNode(node);
  const endNode = last?.position?.end;
  const end = [endGroup, endNode].sort((a, b) => (b?.offset ?? 0) - (a?.offset ?? 0))[0];
  if (!start || !end) return undefined;
  return { start, end };
}

export function unnestParagraphs(node: GenericNode, selector: string) {
  // If the terms and defs are in a single paragraph, unnest them
  const unnest = selectAll(selector, node) as GenericNode[];
  unnest.forEach((n) => {
    if (n.children?.length === 1 && n.children[0].type === 'paragraph') {
      n.children = n.children[0].children;
    }
  });
}

export function stripPositions(
  node?: GenericNode | GenericNode[] | string,
): GenericNode | GenericNode[] | string {
  if (!node || typeof node === 'string') return node as string;
  if (Array.isArray(node)) return node.map(stripPositions) as GenericNode[];
  delete node.position;
  if (Array.isArray(node.children)) node.children = stripPositions(node.children) as GenericNode[];
  if (Array.isArray(node.content)) node.content = stripPositions(node.content);
  if (Array.isArray(node.args)) node.args = stripPositions(node.args);
  return node;
}
