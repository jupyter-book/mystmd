import type { GenericNode, GenericParent } from 'myst-common';
import { processLatexToAstViaUnified } from '@unified-latex/unified-latex';
import { getArguments } from './utils';

function parseArgument(node: GenericNode, next: GenericNode): boolean {
  if (!node.args) node.args = [];
  if (next.type === 'group') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, openMark, closeMark, ...rest } = next;
    node.args.push({ type: 'argument', openMark: '{', closeMark: '}', ...rest });
    return true;
  }
  if (next.type === 'string') {
    if (next.content === '*') {
      node.star = true;
      if (node.position && next.position) node.position.end = next.position.end;
      return true;
    }
    if (next.content === '[' && getArguments(node, 'group').length === 0) {
      node.args.push({
        type: 'argument',
        content: [],
        openMark: '[', // will `closeMark` in next pass
        position: { start: next.position?.start },
      });
      return true;
    }
    const lastArg = node.args[node.args.length - 1];
    if (!lastArg) return false;
    if (!lastArg.closeMark && next.content === ']') {
      lastArg.closeMark = ']';
      lastArg.position.end = next.position?.end;
      return true;
    }
    if (!lastArg.closeMark) {
      lastArg.content.push(next);
      lastArg.position.end = next.position?.end;
      return true;
    }
  }
  return false;
}

const macros: Record<string, number> = {
  // articletype: 1,
  // author: 1,
  // affil: 1,
  // publicationdate: 1,
  // editor: 1,
  // curator: 1,
  // submitteddate: 1,
  // accepteddate: 1,
  // citethisas: 2,
  citet: 1,
  citep: 1,
  citeauthor: 1,
  Citet: 1,
  Citep: 1,
  Citeauthor: 1,
  citeyear: 1,
  citeyearpar: 1,
  primarypubs: 2,
  eqref: 1,
  textsubscript: 1,
  textsuperscript: 1,
  // section: 1,
  // textbf: 1,
  // framebox: 1,
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
};

function walkLatex(node: GenericNode): GenericNode | GenericParent | undefined {
  if (Array.isArray(node.content)) {
    const content = (node.content as GenericParent[])
      .map((n) => walkLatex(n))
      .filter((n): n is GenericNode => !!n)
      .reduce((l, n) => {
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
        return [...l, n];
      }, [] as GenericNode[]);
    return { ...node, content };
  }
  if (Array.isArray(node.args)) {
    const args = (node.args as GenericParent[])
      .map((n) => walkLatex(n))
      .filter((n): n is GenericNode => !!n);
    return { ...node, args };
  }
  return node;
}

export function parseLatex(value: string): GenericParent {
  const raw = processLatexToAstViaUnified().processSync({ value });
  const tree = raw.result as GenericParent;
  return walkLatex(tree) as GenericParent;
}
