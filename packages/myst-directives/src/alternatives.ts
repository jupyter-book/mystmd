import type { Alternatives } from 'myst-spec-ext';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';
import { type DirectiveSpec, type DirectiveData, type GenericNode } from 'myst-common';
import { selectAll } from 'unist-util-select';

export const alternativesDirective: DirectiveSpec = {
  name: 'alternatives',
  doc: 'Alternatives group together a selection of similar representations of some content. For example, a video and still image for static exports.',
  options: commonDirectiveOptions('alternative'),
  body: {
    type: 'myst',
    doc: 'The body of the alternative. If there is no title and the body starts with bold text or a heading, that content will be used as the alternative title.',
  },
  run(data: DirectiveData): GenericNode[] {
    const root = {
      type: 'root',
      children: (data.body as GenericNode[]) ?? [],
    };
    const children = selectAll('image,anywidget', root);

    const alternative: Alternatives = {
      type: 'alternatives',
      children: children,
    };
    addCommonDirectiveOptions(data, alternative);
    return [alternative];
  },
};
