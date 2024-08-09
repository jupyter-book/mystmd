import type { RoleSpec } from 'myst-common';
import type { Raw } from 'myst-spec-ext';

export const rawLatexRole: RoleSpec = {
  name: 'raw:latex',
  alias: ['raw:tex'],
  doc: 'Allows you to include tex in your document that will only be included in tex exports',
  body: {
    type: String,
    doc: 'Raw tex content',
  },
  run(data): Raw[] {
    const lang = 'tex';
    const tex = (data.body as string) ?? '';
    return [
      {
        type: 'raw',
        lang,
        tex,
      },
    ];
  },
};

export const rawTypstRole: RoleSpec = {
  name: 'raw:typst',
  alias: ['raw:typ'],
  doc: 'Allows you to include typst in your document that will only be included in typst exports',
  body: {
    type: String,
    doc: 'Raw typst content',
  },
  run(data): Raw[] {
    const lang = 'typst';
    const typst = (data.body as string) ?? '';
    return [
      {
        type: 'raw',
        lang,
        typst,
      },
    ];
  },
};
