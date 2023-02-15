import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { toText, ParseTypesEnum } from 'myst-common';

export const imageDirective: DirectiveSpec = {
  name: 'image',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  options: {
    // name: {
    //   type: ParseTypesEnum.string,
    // },
    class: {
      type: ParseTypesEnum.string,
      // class_option: list of strings?
    },
    height: {
      type: ParseTypesEnum.string,
      // length_or_unitless,
    },
    width: {
      type: ParseTypesEnum.string,
      // length_or_percentage_or_unitless,
    },
    alt: {
      type: ParseTypesEnum.string,
    },
    // scale: {
    //   type: ParseTypesEnum.number,
    // },
    // target: {
    //   type: ParseTypesEnum.string,
    // },
    align: {
      type: ParseTypesEnum.string,
      // choice(["left", "center", "right", "top", "middle", "bottom"])
    },
    title: {
      type: ParseTypesEnum.string,
    },
  },
  run(data: DirectiveData): GenericNode[] {
    const { alt, class: c, height, width, align, title } = data.options || {};
    return [
      {
        type: 'image',
        url: data.arg as string,
        alt: alt ?? data.body ? toText(data.body as GenericNode[]) : undefined,
        title,
        class: c,
        height,
        width,
        align: align ?? 'center',
      },
    ];
  },
};
