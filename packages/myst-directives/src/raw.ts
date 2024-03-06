import type { DirectiveSpec } from 'myst-common';
import type { Raw } from 'myst-spec-ext';

export const rawDirective: DirectiveSpec = {
  name: 'raw',
  doc: 'Allows you to include the source or parsed version of a separate file into your document tree.',
  arg: {
    type: String,
    doc: 'Format of directive content - for now, only "latex" is valid',
  },
  body: {
    type: String,
    doc: 'Raw content to be parsed',
  },
  run(data): Raw[] {
    return [
      {
        type: 'raw',
        lang: (data.arg as string) ?? '',
        value: (data.body as string) ?? '',
      },
    ];
  },
};
