import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { toText } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const imageDirective: DirectiveSpec = {
  name: 'image',
  arg: {
    type: String,
    doc: 'The filename of an image (e.g. `my-fig.png`).',
    required: true,
  },
  options: {
    ...commonDirectiveOptions('image'),
    class: {
      type: String,
      // class_option: list of strings?
    },
    height: {
      type: String,
      doc: 'The image height, in CSS units, for example `4em` or `300px`.',
      alias: ['h'],
    },
    width: {
      type: String,
      alias: ['w'],
      doc: 'The image width, in CSS units, for example `50%` or `300px`.',
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
      // choice(["left", "center", "right", "top", "middle", "bottom"])
      doc: 'The alignment of the image. Choose one of `left`, `center` or `right`',
    },
    title: {
      type: String,
      doc: 'Title text for the image',
    },
  },
  run(data: DirectiveData): GenericNode[] {
    const { alt, class: c, height, width, align, title } = data.options || {};
    const image = {
      type: 'image',
      url: data.arg as string,
      alt: alt ?? (data.body ? toText(data.body as GenericNode[]) : undefined),
      title,
      class: c,
      height,
      width,
      align: align ?? 'center',
    };
    addCommonDirectiveOptions(data, image);
    return [image];
  },
};
