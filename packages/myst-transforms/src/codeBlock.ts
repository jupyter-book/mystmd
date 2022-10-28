import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Code, Directive, Container, Caption } from 'myst-spec';
import { selectAll } from 'unist-util-select';

export function codeBlockTransform(mdast: Root) {
  const directives = selectAll('mystDirective[name="code-block"]', mdast) as Directive[];
  directives.forEach((node) => {
    if (!node.options?.name && !node.options?.caption) return;
    const code = node.children?.[0] as Code;
    const caption: Caption = {
      type: 'caption',
      children: [
        {
          type: 'paragraph',
          // TODO: this should be parsed and dealt with much earlier
          children: [{ type: 'text', value: node.options.caption as string }],
        },
      ],
    };
    const container: Container = {
      type: 'container',
      kind: 'code' as any,
      label: code.label,
      identifier: code.identifier,
      children: [code as any, caption],
    };
    delete code.label;
    delete code.identifier;
    node.children = container as any;
  });
}

export const codeBlockPlugin: Plugin<[], Root, Root> = () => (tree) => {
  codeBlockTransform(tree);
};
