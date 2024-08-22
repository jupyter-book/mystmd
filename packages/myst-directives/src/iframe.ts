import type { Iframe } from 'myst-spec-ext';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const iframeDirective: DirectiveSpec = {
  name: 'iframe',
  arg: {
    type: String,
    doc: 'The URL source (`src`) of the HTML iframe element.',
    required: true,
  },
  options: {
    ...commonDirectiveOptions('iframe'),
    class: {
      type: String,
      // class_option: list of strings?
    },
    width: {
      type: String,
      doc: 'The iframe width, in CSS units, for example `50%` or `300px`.',
    },
    align: {
      type: String,
      doc: 'The alignment of the iframe in the page. Choose one of `left`, `center` or `right`',
    },
  },
  body: { type: 'myst', doc: 'If provided, this will be the iframe caption.' },
  run(data: DirectiveData): GenericNode[] {
    const iframe: Iframe = {
      type: 'iframe',
      src: data.arg as string,
      width: data.options?.width as string,
      align: data.options?.align as Iframe['align'],
    };
    if (!data.body) {
      iframe.class = data.options?.class as string;
      addCommonDirectiveOptions(data, iframe);
      return [iframe];
    }
    const container = {
      type: 'container',
      kind: 'figure',
      class: data.options?.class,
      children: [iframe, { type: 'caption', children: data.body as GenericNode[] }],
    };
    addCommonDirectiveOptions(data, container);
    return [container];
  },
};
