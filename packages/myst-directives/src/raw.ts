import type { DirectiveSpec } from 'myst-common';
import type { Raw } from 'myst-spec-ext';

export const rawDirective: DirectiveSpec = {
  name: 'raw',
  doc: 'Allows you to include non-markdown text in your document. If the argument "latex" is provided, the text will be parsed as latex; otherwise, it will be included as raw text.',
  arg: {
    type: String,
    doc: 'Format of directive content - for now, only "latex" is valid',
  },
  body: {
    type: String,
    doc: 'Raw content to be parsed',
  },
  run(data): Raw[] {
    const lang = (data.arg as string) ?? '';
    const value = (data.body as string) ?? '';
    const tex = ['tex', 'latex'].includes(lang) ? `\n${value}\n` : undefined;
    const typst = ['typst', 'typ'].includes(lang) ? `\n${value}\n` : undefined;
    return [
      {
        type: 'raw',
        lang,
        tex,
        typst,
        value,
      },
    ];
  },
};

export const rawLatexDirective: DirectiveSpec = {
  name: 'raw:latex',
  alias: ['raw:tex'],
  doc: 'Allows you to include tex in your document that will only be included in tex exports',
  body: {
    type: String,
    doc: 'Raw tex content',
  },
  run(data): Raw[] {
    const lang = 'tex';
    const body = data.body as string;
    const tex = body ? `\n${body}\n` : '';
    return [
      {
        type: 'raw',
        lang,
        tex,
      },
    ];
  },
};

export const rawTypstDirective: DirectiveSpec = {
  name: 'raw:typst',
  alias: ['raw:typ'],
  doc: 'Allows you to include typst in your document that will only be included in typst exports',
  body: {
    type: String,
    doc: 'Raw typst content',
  },
  run(data): Raw[] {
    const lang = 'typst';
    const body = data.body as string;
    const typst = body ? `\n${body}\n` : '';
    return [
      {
        type: 'raw',
        lang,
        typst,
      },
    ];
  },
};
