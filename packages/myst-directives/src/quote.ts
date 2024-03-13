import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { remove } from 'unist-util-remove';
import { copyNode } from 'myst-common';

const ATTRIBUTION_PATTERN = /(?:---?(?!-)|\u2014) +(.*)/;

export const epigraphDirective: DirectiveSpec = {
  name: 'epigraph',
  doc: 'Inscriptions, or "epigraphs", provide a short quote or inscription at the beginning of a topic. They are usually pertinent to the subsequent content, either to set the theme, or establish a counter-example.',
  body: {
    type: 'myst',
    doc: 'The body of the epigraph.',
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }

    // Find any captions
    for (const node of children) {
      if (node.type !== 'paragraph') {
        continue;
      }
      if (!node.children) {
        continue;
      }
      const child = node.children[0];
      if (child.type !== 'text') {
        continue;
      }
      const match = child.value?.match(ATTRIBUTION_PATTERN);
      if (!match) {
        continue;
      }
      // Mutate matched node to drop `-- `
      child.value = match[1];

      // Remove matched node if text is now empty
      if (!child.value) {
        child.type = '__delete__';
      }

      // Save copy of node
      const captionParagraph = copyNode(node);

      // Delete original node
      node.type = '__delete__';

      const container = {
        type: 'container',
        kind: 'quote',
        children: [
          {
            type: 'blockquote',
            children: children as any[],
          },
          {
            type: 'caption',
            children: [captionParagraph],
          },
        ],
      };
      // Delete duplicate caption
      remove(container, '__delete__');
      return [container];
    }

    const quote = {
      type: 'blockquote',
      children: children as any[],
    };
    return [quote];
  },
};
