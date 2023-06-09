import type { Handle, Info } from 'mdast-util-to-markdown';
import { defaultHandlers } from 'mdast-util-to-markdown';
import type { NestedState, Parent } from './types.js';

function labelWrapper(handler: Handle) {
  return (node: any, _: Parent, state: NestedState, info: Info): string => {
    const prefix = node.label ? `(${node.label})=\n` : '';
    return `${prefix}${handler(node, _, state, info)}`;
  };
}

function crossReference(node: any, _: Parent, state: NestedState, info: Info): string {
  const { urlSource, label, identifier } = node;
  const nodeCopy = {
    ...node,
    url: urlSource ?? (label ? `#${label}` : identifier ? `#${identifier}` : ''),
  };
  return defaultHandlers.link(nodeCopy, _, state, info);
}

export const referenceHandlers: Record<string, Handle> = {
  crossReference,
  heading: labelWrapper(defaultHandlers.heading),
  paragraph: labelWrapper(defaultHandlers.paragraph),
  blockquote: labelWrapper(defaultHandlers.blockquote),
  list: labelWrapper(defaultHandlers.list),
};
