import type { GenericNode } from 'myst-common';
import { copyNode } from 'myst-common';
import { selectAll } from 'unist-util-select';

/** https://en.wikipedia.org/wiki/Thin_space */
export const THIN_SPACE = ' ';

/** https://en.wikipedia.org/wiki/Non-breaking_space#Width_variation */
export const NARROW_NO_BREAK_SPACE = ' ';

// There is probably a better way to explicitly add accents to letters in node.
// https://en.wikibooks.org/wiki/LaTeX/Special_Characters#Escaped_codes
export const LatexAccents = {
  '`': { o: 'ò', O: 'Ò' },
  "'": { o: 'ó', O: 'Ó' },
  '^': { '': '^', e: 'ê', o: 'ô', i: 'î', y: 'ŷ', E: 'Ê', O: 'Ô', I: 'Î', Y: 'Ŷ' },
  '"': { o: 'ö', u: 'ü', i: 'ï', O: 'Ö', U: 'Ü', I: 'Ï' },
  H: { o: 'ő', O: 'Ő' },
  '~': {
    '': '~',
    a: 'ã',
    A: 'Ã',
    o: 'õ',
    n: 'ñ',
    O: 'Õ',
    N: 'Ñ',
    u: 'ũ',
    U: 'Ũ',
    e: 'ẽ',
    E: 'Ẽ',
    i: 'ĩ',
    I: 'Ĩ',
  },
  c: { c: 'ç', C: 'Ç', s: 'ş', S: 'Ş' },
  k: { a: 'ą', A: 'Ą' },
  l: { '': 'ł' },
  '=': { o: 'ō', O: 'Ō' },
  '.': { o: 'ȯ', O: 'Ȯ' },
  d: { u: 'ụ', U: 'Ụ' },
  r: { a: 'å', A: 'Å' },
  u: { o: 'ŏ', O: 'Ŏ' },
  v: { s: 'š', S: 'Š' },
  t: { oo: 'o͡o', OO: 'O͡O' },
  o: { '': 'ø' },
  i: { '': 'ı' },
};

// https://en.wikibooks.org/wiki/LaTeX/Special_Characters#Other_symbols
export const LatexSpecialSymbols = {
  '%': '%',
  $: '$',
  '&': '&',
  '{': '{',
  '}': '}',
  _: '_',
  P: '¶',
  dag: '†',
  ddag: '‡',
  textbar: '|',
  textgreater: '>',
  textless: '<',
  textendash: '–',
  textemdash: '—',
  texttrademark: '™',
  textregistered: '®',
  copyright: '©',
  textexclamdown: '¡',
  textquestiondown: '¿',
  pounds: '£',
  // \usepackage[official]{eurosym}
  euro: '€',
  '#': '#',
  S: '§',
  textbackslash: '\\',
  textcelsius: '℃',
  degreeCelsius: '℃',
  celsius: '℃',
  aa: 'å',
  AA: 'Å',
  dots: '…',
  ldots: '…',
  texttimes: '×',
  textellipsis: '…',
  textdegree: '°',
  degree: '°',
  textasciitilde: '~',
  textvisiblespace: ' ', // Not sure this will work, but close enough
  ' ': ' ', // this is a single backslash followed by a space
  ',': THIN_SPACE, // this is a thin space (https://en.wikipedia.org/wiki/Thin_space) `\,` in latex
};

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
  'delete',
  'crossReference',
]);

export const UNHANDLED_ERROR_TEXT = 'Unhandled TEX conversion';

export function originalValue(original: string, node: Pick<GenericNode, 'position'>): string {
  const from = node.position?.start.offset;
  const to = node.position?.end.offset;
  if (from == null || to == null) return '';
  return original.slice(from, to);
}

export function hasStar(node: GenericNode): boolean {
  const first = node.args?.[0];
  if (!first) return false;
  if (
    first.content?.length === 1 &&
    first.content[0].type === 'string' &&
    first.content[0].content === '*' &&
    first.openMark === '' &&
    first.closeMark === ''
  )
    return true;
  return false;
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

export function extractParams(args: { content: string }[]): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  for (let i = 0; i < args.length - 2; i++) {
    const param = args[i].content;
    const equalsSign = args[i + 1].content;
    const value = args[i + 2].content;

    if (equalsSign === '=' && (Number.isFinite(Number.parseFloat(value)) || value)) {
      params[param] = Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : value;
      i += 2; // Skip the processed elements
    }
  }

  return params;
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

export function isAccent(node?: GenericNode): boolean {
  if (node?.type !== 'macro') return false;
  if (node.content in LatexAccents) return true;
  return false;
}

export function isSpecialSymbol(node?: GenericNode): boolean {
  if (node?.type !== 'macro') return false;
  if (node.content in LatexSpecialSymbols) return true;
  return false;
}

export function texToText(content?: GenericNode[] | GenericNode | string | null): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return texToText([content]);
  return (content as GenericNode[])
    .map((n) => {
      if (n.type === 'whitespace') return ' ';
      if (n.type === 'comment') return '';
      if (isSpecialSymbol(n)) {
        return LatexSpecialSymbols[n.content as keyof typeof LatexSpecialSymbols];
      }
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
    if (node.type === 'macro' && last?.position?.end.offset && lastArg.closeMark.match(/^\}|\]$/)) {
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
