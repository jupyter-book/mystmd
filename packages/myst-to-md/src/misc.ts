import type { Handle, Info, State } from 'mdast-util-to-markdown';
import type { Parent } from './types';

function comment(node: any): string {
  return `% ${node.value}`;
}

function block(node: any, _: Parent, state: State, info: Info): string {
  const meta = node.meta ? ` ${node.meta}` : '';
  const content = state.containerFlow(node, info);
  return `+++${meta}\n${content}`;
}

function definitionList(node: any, _: Parent, state: State, info: Info): string {
  node.children?.forEach((child: any) => {
    if (!['definitionTerm', 'definitionDescription'].includes(child.type)) {
      throw Error();
    }
  });
  return state.containerFlow(node, info);
}

function definitionTerm(node: any, _: Parent, state: State, info: Info) {
  return state.containerPhrasing(node, info);
}

function definitionDescription(node: any, _: Parent, state: State, info: Info) {
  const contentLines = state.containerFlow(node, info).split('\n');
  const indented = contentLines.map((line, ind) => {
    if (!line && ind) return line;
    const prefix = ind ? `    ` : `:   `;
    return `${prefix}${line}`;
  });
  return indented.join('\n');
}

export const miscHandlers: Record<string, Handle> = {
  block,
  comment,
  mystComment: comment,
  definitionList,
  definitionTerm,
  definitionDescription,
};
