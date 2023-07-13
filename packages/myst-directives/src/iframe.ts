import type { Iframe } from 'myst-spec-ext';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum, normalizeLabel } from 'myst-common';

export const iframeDirective: DirectiveSpec = {
  name: 'iframe',
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
  body: { type: ParseTypesEnum.parsed },
  run(data: DirectiveData): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const iframe: Iframe = {
      type: 'iframe',
      src: data.arg as string,
      width: data.options?.width as string,
      align: data.options?.align as Iframe['align'],
    };
    if (!data.body) {
      iframe.label = label;
      iframe.identifier = identifier;
      iframe.class = data.options?.class as string;
      return [iframe];
    }
    const container = {
      type: 'container',
      kind: 'figure',
      identifier,
      label,
      class: data.options?.class,
      children: [iframe, { type: 'caption', children: data.body as GenericNode[] }],
    };
    return [container];
  },
};
