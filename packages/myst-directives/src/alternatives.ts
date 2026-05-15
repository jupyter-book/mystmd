import type { Alternatives } from 'myst-spec-ext';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';
import { type DirectiveSpec, type DirectiveData, type GenericNode, fileError } from 'myst-common';
import type { VFile } from 'vfile';

export const alternativesDirective: DirectiveSpec = {
  name: 'alternatives',
  doc: 'Alternatives group together a selection of similar representations of some content. For example, a video and still image for static exports.',
  options: commonDirectiveOptions('alternative'),
  body: {
    type: 'myst',
    doc: 'The body of the alternative. If there is no title and the body starts with bold text or a heading, that content will be used as the alternative title.',
  },
  run(data: DirectiveData, vfile: VFile): GenericNode[] {
    const rawChildren: GenericNode[] = (data.body as GenericNode[]) ?? [];
    const children = rawChildren.filter((n) => n.type === 'image' || n.type === 'anywidget');

    if (children.length !== rawChildren.length) {
      fileError(vfile, `alternatives can only contain images or anywidgets`);
    }

    const alternative: Alternatives = {
      type: 'alternatives',
      children: children as any[],
    };
    addCommonDirectiveOptions(data, alternative);
    return [alternative];
  },
};
