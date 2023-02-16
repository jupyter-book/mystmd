import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const iframeDirective: DirectiveSpec = {
  name: 'iframe',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  options: {
    label: {
      type: ParseTypesEnum.string,
    },
    width: {
      type: ParseTypesEnum.string,
      // length_or_percentage_or_unitless,
    },
    align: {
      type: ParseTypesEnum.string,
      // choice(["left", "center", "right"])
    },
  },
  run(data: DirectiveData): GenericNode[] {
    const { label, width, align } = data.options || {};
    return [
      {
        type: 'iframe',
        src: data.arg as string,
        label: label as string | undefined,
        width,
        align,
      },
    ];
  },
};
