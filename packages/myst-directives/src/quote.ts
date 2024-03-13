import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import classNames from 'classnames';

export const blockQuoteDirective: DirectiveSpec = {
  name: 'block-quote',
  alias: ['epigraph', 'pull-quote'],
  doc: 'Block quotes are used to indicate that the enclosed content forms an extended quotation. They may be followed by an inscription or attribution formed of a paragraph beginning with `--`, `---`, or an em-dash.',
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
    class: {
      type: String,
      doc: `CSS classes to add to your block-quote. Special classes include:

- \`pull-quote\`: used for block-quotes which should attract attention
- \`epigraph\`: used for block-quotes that are usually found at the beginning of a document`,
    },
  },
  body: {
    type: 'myst',
    doc: 'The body of the block-quote.',
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }

    const className = data.options?.class as string;
    const container = {
      type: 'container',
      kind: 'quote',
      label: data.options?.label as string | undefined,
      class: classNames({ [className]: className, [data.name]: data.name !== 'block-quote' }),
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
