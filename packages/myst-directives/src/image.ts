import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

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
    // height: {
    //   type: ParseTypesEnum.string,
    //   // length_or_unitless,
    // },
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
  },
  run(data: DirectiveData): GenericNode[] {
    const { alt, class: c, width, align } = data.options || {};
    return [
      {
        type: 'image',
        url: data.arg as string,
        alt,
        class: c,
        width,
        align,
      },
    ];
  },
};
