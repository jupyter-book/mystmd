import type { InlineExpression } from 'myst-spec-ext';
import type { Element, Handler } from './types';

// function renderMimeToJats(state: IJatsSerializer, node: GenericNode): Element[] {
//   const { result } = node as InlineExpression;
//   return Object.entries(result?.data ?? {}).map(([key, value]): Element => {
//     switch (key) {
//       case 'text/plain':
//         return { type: 'text', text: value as string };
//       default:
//         state.error(`Unknown inline render target of type ${key}`, node);
//         return { type: 'text', text: 'Unknown Inline Expression' };
//     }
//   });
// }

export const inlineExpression: Handler = (node, state) => {
  const { identifier, value } = node as InlineExpression;
  state.renderInline(node, 'xref', {
    'ref-type': 'custom',
    'custom-type': 'expression',
    rid: identifier,
  });
  const element = {
    type: 'element',
    name: 'sec',
    attributes: { id: identifier, 'sec-type': 'expression' },
    elements: [
      {
        type: 'element',
        name: 'code',
        attributes: { executable: 'yes' },
        elements: [{ type: 'text', text: value }],
      },
      {
        type: 'element',
        name: 'sec',
        attributes: { 'sec-type': 'notebook-output' },
        elements: [{ type: 'element', name: 'p', elements: [{ type: 'text', text: value }] }],
      },
    ],
  } as Element;
  state.warn('JATS representations of inline expressions is not complete', node);
  if (element) state.expressions.push(element);
};
