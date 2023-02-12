import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';

export const figureDirective: DirectiveSpec = {
  name: 'figure',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  options: {
    name: {
      type: ParseTypesEnum.string,
    },
    class: {
      type: ParseTypesEnum.string,
      // class_option: list of strings?
    },
    // height: {
    //   type: ParseTypesEnum.string,
    //   // length_or_unitless,
    // },
    // width: {
    //   type: ParseTypesEnum.string,
    //   // length_or_percentage_or_unitless,
    // },
    alt: {
      type: ParseTypesEnum.string,
    },
    // scale: {
    //   type: ParseTypesEnum.number,
    // },
    // target: {
    //   type: ParseTypesEnum.string,
    // },
    // align: {
    //   type: ParseTypesEnum.string,
    //   // choice(["left", "center", "right"])
    // },
    // figwidth: {
    //   type: ParseTypesEnum.string,
    //   // length_or_percentage_or_unitless_figure
    // },
    // figclass: {
    //   type: ParseTypesEnum.string,
    //   // class_option: list of strings?
    // },
  },
  body: {
    type: ParseTypesEnum.parsed,
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [
      {
        type: 'image',
        url: data.arg as string,
        alt: data.options?.alt,
      },
    ];
    if (data.body) {
      const [caption, ...legend] = data.body as GenericNode[];
      if (caption) {
        children.push({ type: 'caption', children: [caption] });
      }
      if (legend.length) {
        children.push({ type: 'legend', children: legend });
      }
    }
    const { label, identifier } = normalizeLabel(data.options?.name as string | undefined) || {};
    const container = {
      type: 'container',
      kind: 'figure',
      identifier,
      label,
      class: data.options?.class,
      children,
    };
    return [container];
  },
};
