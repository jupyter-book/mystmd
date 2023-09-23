import type { Image } from 'myst-spec-ext';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';

export const figureDirective: DirectiveSpec = {
  name: 'figure',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  options: {
    label: {
      type: ParseTypesEnum.string,
      alias: ['name'],
    },
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
      // TODO: validate that this is a CSS width
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
      // TODO: this is not implemented below
      // choice(["left", "center", "right"])
    },
    // figwidth: {
    //   type: ParseTypesEnum.string,
    //   // length_or_percentage_or_unitless_figure
    // },
    // figclass: {
    //   type: ParseTypesEnum.string,
    //   // class_option: list of strings?
    // },
    'remove-input': {
      type: ParseTypesEnum.boolean,
    },
    'remove-output': {
      type: ParseTypesEnum.boolean,
    },
    placeholder: {
      type: ParseTypesEnum.string,
    },
  },
  body: {
    type: ParseTypesEnum.parsed,
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
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
      // TODO: This is probably better as a transform in the future
      const nodes = data.body as GenericNode[];
      // Allow multiple images to be added before a caption
      const firstNonImage = nodes.findIndex(({ type }) => type !== 'image');
      const images = nodes.slice(0, firstNonImage);
      children.push(...images);
      const [caption, ...legend] = nodes.slice(firstNonImage);
      if (caption) {
        children.push({ type: 'caption', children: [caption] });
      }
      if (legend.length) {
        children.push({ type: 'legend', children: legend });
      }
    }
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
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
