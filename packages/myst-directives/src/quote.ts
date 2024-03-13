import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
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

    const container = {
      type: 'container',
      kind: 'quote',
      class: 'epigraph',
      children: [
        {
          type: 'blockquote',
          children: children as any[],
        },
      ],
    };
    return [container];
  },
};

export const pullQuoteDirective: DirectiveSpec = {
  name: 'pull-quote',
  doc: 'Pull-quotes add emphasis to a small selection of text by pulling it out into a separate, quoted block - usually of a larger typeface. They are used to attract attention, especially in documents that consist of considerable prose.',
  body: {
    type: 'myst',
    doc: 'The body of the pull-quote.',
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }

    const container = {
      type: 'container',
      kind: 'quote',
      class: 'pull-quote',
      children: [
        {
          type: 'blockquote',
          children: children as any[],
        },
      ],
    };
    return [container];
  },
};
