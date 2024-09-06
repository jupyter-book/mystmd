import type { DirectiveSpec, DirectiveData, GenericNode, GenericParent } from 'myst-common';
import type { FlowContent, ListContent, PhrasingContent } from 'myst-spec';

export const linkBlockDirective: DirectiveSpec = {
  name: 'link-block',
  arg: {
    type: String,
    doc: 'Link block URL',
    required: true,
  },
  options: {
    title: {
      type: String,
      doc: 'Link title',
    },
    // thumbnail: {
    //   type: String,
    //   doc: 'Path to link thumbnail',
    // },
  },
  body: {
    type: 'myst',
  },
  run(data: DirectiveData): GenericNode[] {
    const linkBlock: GenericParent = {
      type: 'linkBlock',
      url: data.arg,
      title: data.options?.title,
      thumbnail: data.options?.thumbnail,
      children: [],
    };
    if (data.body) {
      linkBlock.children = [
        ...(data.body as unknown as (FlowContent | ListContent | PhrasingContent)[]),
      ];
    }
    return [linkBlock];
  },
};
