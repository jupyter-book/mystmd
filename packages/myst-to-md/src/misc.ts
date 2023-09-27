import type { Handle, Info, State } from 'mdast-util-to-markdown';
import { RuleId, fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import type { Parent, Validator } from './types.js';

function comment(node: any, _: Parent, state: State): string {
  return state.indentLines(node.value, (line: string, _1: any, blank: boolean) => {
    return (blank ? '' : '% ') + line;
  });
}

function block(node: any, _: Parent, state: State, info: Info): string {
  const meta = node.meta ? ` ${node.meta}` : '';
  const content = state.containerFlow(node, info);
  return `+++${meta}\n${content}`;
}

function definitionListValidator(node: any, file: VFile) {
  node.children?.forEach((child: any) => {
    if (!['definitionTerm', 'definitionDescription'].includes(child.type)) {
      fileWarn(file, `Unexpected child in definitionList: ${node.type}`, {
        node,
        source: 'myst-to-md',
        ruleId: RuleId.mdRenders,
      });
    }
  });
}

function definitionList(node: any, _: Parent, state: State, info: Info): string {
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
  definitionList,
  definitionTerm,
  definitionDescription,
  captionNumber: () => '',
};

export const miscValidators: Record<string, Validator> = {
  definitionList: definitionListValidator,
};
