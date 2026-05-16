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
    let rawChildren: GenericNode[] = (data.body as GenericNode[]) ?? [];

    // Multiple images are presented as paragraph of images.
    // We could also walk down the tree, but this is only temporary and a 
    // reasonable assumption
    if (rawChildren.length === 1 && rawChildren[0].type === 'paragraph') {
      rawChildren = rawChildren[0].children as any[];
    }
    const children = rawChildren.filter((n) => n.type === 'image' || n.type === 'anywidget');

    if (children.length !== rawChildren.length) {
      console.dir(children);
      console.dir(rawChildren);
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
