import type { GenericNode, GenericParent } from 'myst-common';
import { processLatexToAstViaUnified } from '@unified-latex/unified-latex';
import { getArguments, isSpecialSymbol } from './utils.js';

function parseArgument(node: GenericNode, next: GenericNode): boolean {
  if (!node.args) node.args = [];
  if (next.type === 'group') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, openMark, closeMark, ...rest } = next;
    node.args.push({ type: 'argument', openMark: '{', closeMark: '}', ...rest });
    return true;
  }
  if (next.type === 'string' || next.type === 'whitespace' || isSpecialSymbol(next)) {
    if (next.content === '*') {
      node.star = true;
      if (node.position && next.position) node.position.end = next.position.end;
      return true;
    }
    const lastArg = node.args[node.args.length - 1];
    if (
      (mixed_arg_macros.includes(node.content) && next.content === '[') ||
      (((next.content === '[' && (!lastArg || lastArg.openMark === '[')) ||
        (next.content === '(' && (!lastArg || lastArg.openMark === ')'))) &&
        getArguments(node, 'group').length === 0)
    ) {
      node.args.push({
        type: 'argument',
        content: [],
        openMark: next.content, // will `closeMark` in next pass
        position: { start: next.position?.start },
      });
      return true;
    }
    if (!lastArg) return false;
    if (
      !lastArg.closeMark &&
      ((next.content === ']' && lastArg.openMark === '[') ||
        (next.content === ')' && lastArg.openMark === '('))
    ) {
      lastArg.closeMark = next.content;
      if (lastArg.position) lastArg.position.end = next.position?.end;
      return true;
    }
    if (!lastArg.closeMark) {
      lastArg.content.push(next);
      if (lastArg.position) lastArg.position.end = next.position?.end;
      return true;
    }
  }
  return false;
}

// Maximum number of arguments for each macro
const macros: Record<string, number> = {
  citet: 1,
  citep: 1,
  citeauthor: 1,
  Citet: 1,
  Citep: 1,
  Citeauthor: 1,
  citealp: 1,
  citeyear: 1,
  citeyearpar: 1,
  primarypubs: 2,
  eqref: 1,
  nameref: 1,
  subref: 1,
  textsubscript: 1,
  textsuperscript: 1,
  adjustwidth: 2,
  author: 1,
  email: 1,
  affil: 1,
  affiliation: 1,
  framebox: 1,
  epigraph: 2,
  tnote: 1,
  ['table*']: 1,
  arraystretch: 1,
  multirow: 5,
  multicolumn: 3,
  subfigure: 2,
  wrapfigure: 3,
  tabularx: 2,
  longtable: 2,
  ['longtable*']: 2,
  supertabular: 1,
  cmidrule: 2,
  cline: 1,
  adjustbox: 1,
  resizebox: 2,
  captionof: 2,
  itemsep: 1,
  // Algorithms and proofs
  algorithm: 1,
  algorithmic: 1,
  For: 1,
  ForAll: 1,
  While: 1,
  If: 1,
  ElsIf: 1,
  Comment: 1,
  Until: 1,
  Procedure: 2,
  Function: 2,
  // SI Units: https://texdoc.org/serve/siunitx/0
  SI: 2,
  si: 1,
  qty: 2,
  tothe: 1,
  raiseto: 1,
  ang: 1,
  unit: 1,
  // Chem
  ce: 1,
  // These are character replacements:
  '`': 1,
  "'": 1,
  '^': 1,
  '"': 1,
  H: 1,
  '~': 1,
  c: 1,
  k: 1,
  l: 1,
  '=': 1,
  b: 1,
  '.': 1,
  d: 1,
  r: 1,
  aa: 1,
  AA: 1,
  t: 1,
  u: 1,
  v: 1,
  // Cancel
  cancel: 1,
  bcancel: 1,
  xcancel: 1,
};

// These macros allow a mix of {} and [] arguments, rather than only allowing
// a single leading [] argument followed by {} arguments.
const mixed_arg_macros = ['multirow'];

/**
 * This fixes up some of the rendering that treats '[' as the first argument.
 *  For example on "author", the first argument is:
 * ```ts
 *  const author = {
 *    type: 'macro',
 *    content: 'author',
 *    args: [
 *      {
 *        content: '[',
 *        openMark: '{',
 *        closeMark: '}',
 *      },
 *    ],
 *  };
 * ```
 *
 * Changes this to:
 * ```ts
 *  const author = {
 *    type: 'macro',
 *    content: 'author',
 *    args: [
 *      {
 *        openMark: '[',
 *        closeMark: '',
 *        content: [],
 *      },
 *    ],
 *  };
 * ```
 *
 * With the next reduce adding the correct arguments, and closing the marks, etc.
 */
function patchOpenArgument(args: GenericNode[]) {
  const i = args.length - 1;
  if (
    args[i]?.content?.length === 1 &&
    args[i].content[0].type === 'string' &&
    args[i].content[0].content?.match(/^\(|\[$/)
  ) {
    args[i].openMark = args[i].content[0].content;
    args[i].closeMark = ''; // Leave this open for parsing in the next round (see above)
    args[i].content = []; // The content is an empty list
  }
}

function walkLatex(node: GenericNode): GenericNode | GenericParent | undefined {
  if (Array.isArray(node.content)) {
    let skipRead = false;
    let skipNextWhitespace = false;
    let content = (node.content as GenericParent[])
      .map((n) => walkLatex(n))
      .filter((n): n is GenericNode => !!n)
      .reduce((l, n) => {
        if (n.type === 'macro' && n.content === 'iffalse') {
          skipRead = true;
          return l;
        }
        if (n.type === 'macro' && n.content === 'fi') {
          skipRead = false;
          skipNextWhitespace = true;
          return l;
        }
        if (skipRead) return l;
        if (skipNextWhitespace && n.type === 'whitespace') {
          skipNextWhitespace = false;
          return l;
        }
        skipNextWhitespace = false;
        const last = l[l.length - 1];
        if (!last) return [n];
        if (last.type === 'macro' && macros[last.content] != null) {
          const currentArgs = getArguments(last, 'group').length;
          const maxArgs = macros[last.content];
          if (currentArgs < maxArgs) {
            const used = parseArgument(last, n);
            if (used) return l;
          }
        }
        // If there are multiple texts in a row, combine some that make special symbols `` or -- or --- or ''
        if (
          last.type === 'string' &&
          n.type === 'string' &&
          last.content?.match(/`|'|-/) &&
          n.content?.match(/`|'|-/)
        ) {
          last.content += n.content;
          return l;
        }
        return [...l, n];
      }, [] as GenericNode[]);

    // Move known environment arguments from `content` to `args`
    if (node.type === 'environment' && macros[node.env] != null) {
      const currentArgs = getArguments(node, 'group').length;
      const maxArgs = macros[node.env];
      let used = true;
      let i = 0;
      while (currentArgs < maxArgs && used) {
        used = parseArgument(node, node.content[i]);
        i += 1;
      }
      content = content.slice(i - 1);
    }
    return { ...node, content };
  }
  if (Array.isArray(node.args)) {
    const args = (node.args as GenericParent[])
      .map((n) => walkLatex(n))
      .filter((n): n is GenericNode => !!n);
    patchOpenArgument(args);
    return { ...node, args };
  }
  return node;
}

export function parseLatex(value: string): GenericParent {
  const file = processLatexToAstViaUnified().processSync({ value });
  const tree = file.result as GenericParent;
  const transformed = walkLatex(tree) as GenericParent;
  return transformed;
}
