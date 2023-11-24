import type { Image } from 'myst-spec-ext';
import type { DirectiveSpec, GenericNode, GenericParent } from 'myst-common';
import { normalizeLabel } from 'myst-common';

export const figureDirective: DirectiveSpec = {
  name: 'figure',
  arg: {
    type: String,
    doc: 'The filename of an image (e.g. `my-fig.png`), or an ID of a Jupyter Notebook cell (e.g. `#my-cell`).',
  },
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
    class: {
      type: String,
      alias: ['figclass'],
      doc: `CSS classes to add to your figure. Special classes include:

- \`full-width\`: changes the figure environment to cover two columns in LaTeX`,
    },
    height: {
      type: String,
      doc: 'The figure height, in CSS units, for example `4em` or `300px`.',
      alias: ['h'],
    },
    width: {
      type: String,
      // TODO: validate that this is a CSS width
      alias: ['w', 'figwidth'],
      doc: 'The figure width, in CSS units, for example `50%` or `300px`.',
    },
    alt: {
      type: String,
      doc: 'Alternative text for the image',
    },
    // scale: {
    //   type: Number,
    // },
    // target: {
    //   type: String,
    // },
    align: {
      type: String,
      doc: 'The alignment of the image in the figure. Choose one of `left`, `center` or `right`',
      // TODO: this is not implemented below
      // choice(["left", "center", "right"])
    },
    'remove-input': {
      type: Boolean,
      doc: 'If the argument is a notebook cell, use this flag to remove the input code from the cell.',
    },
    'remove-output': {
      type: Boolean,
      doc: 'If the argument is a notebook cell, use this flag to remove the output from the cell.',
    },
    placeholder: {
      type: String,
      doc: 'A placeholder image when using a notebook cell as the figure contents. This will be shown in place of the Jupyter output until an execution environment is attached. It will also be used in static outputs, such as a PDF output.',
    },
    'no-subfigures': {
      type: Boolean,
      doc: 'Disallow implicit subfigure creation from child nodes',
      alias: ['no-subfig', 'no-subfigure'],
    },
  },
  body: {
    type: 'myst',
    doc: 'If an argument is provided to the figure directive, the body will be the figure caption. You may also omit the figure directive argument and provide images in the body of the figure, these will be parsed into sub figures.',
  },
  run(data): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      children.push({
        type: 'image',
        url: data.arg as string,
        alt: data.options?.alt as string,
        width: data.options?.width as string,
        height: data.options?.height as string,
        align: data.options?.align as Image['align'],
        // These will pass through if the node is converted to an embed node in the image transform
        'remove-input': data.options?.['remove-input'],
        'remove-output': data.options?.['remove-output'],
      });
    }
    if (data.options?.placeholder) {
      children.push({
        type: 'image',
        placeholder: true,
        url: data.options.placeholder as string,
        alt: data.options?.alt as string,
        width: data.options?.width as string,
        height: data.options?.height as string,
        align: data.options?.align as Image['align'],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const container: GenericParent = {
      type: 'container',
      kind: 'figure',
      identifier,
      label,
      class: data.options?.class,
      children,
    };
    if (data.options?.['no-subfigures']) {
      container.noSubcontainers = true;
    }
    return [container];
  },
};
