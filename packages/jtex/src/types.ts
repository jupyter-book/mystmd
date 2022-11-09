import type { ISession as BaseISession } from 'myst-cli-utils';
import type { Author, PageFrontmatter } from 'myst-frontmatter';
import { PAGE_FRONTMATTER_KEYS } from 'myst-frontmatter';

export interface ISession extends BaseISession {
  API_URL: string;
}

export type TemplateImports = {
  imports: string[];
  commands: Record<string, string>;
};

export type ValueAndIndex = {
  value: any;
  index: number;
  letter: string;
};

export type RendererAuthor = Omit<Author, 'affiliations' | 'corresponding' | 'orcid'> & {
  affiliations?: ValueAndIndex[];
  corresponding?: ValueAndIndex;
  orcid?: string;
  index: number;
  letter?: string;
  given_name: string;
  surname: string;
};

export type RendererDoc = Omit<PageFrontmatter, 'date' | 'authors'> & {
  date: {
    day: string;
    month: string;
    year: string;
  };
  authors: RendererAuthor[];
  affiliations: ValueAndIndex[];
};

export const RENDERER_DOC_KEYS = ['affiliations'].concat(PAGE_FRONTMATTER_KEYS);

export type Renderer = {
  CONTENT: string;
  doc: RendererDoc;
  options: Record<string, any>;
  parts: Record<string, string>;
  IMPORTS?: string;
};
