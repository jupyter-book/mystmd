import type { Author, License } from 'myst-frontmatter';

export enum TemplateKind {
  tex = 'tex',
}

export type TemplateDTO = {
  id: string;
  kind: TemplateKind;
  title: string;
  description: string;
  authors: Author[];
  license?: License;
  tags: string[];
  version: string;
  links: {
    self: string;
    source: string;
    thumbnail: string;
    download: string;
  };
};
