import type { ISession as BaseISession } from 'myst-cli-utils';
import type { Author, Licenses, PageFrontmatter } from 'myst-frontmatter';
import { PAGE_FRONTMATTER_KEYS } from 'myst-frontmatter';

export interface ISession extends BaseISession {
  API_URL: string;
}

export type ExpandedImports = { imports: string[]; commands: string[] };

export type TemplatePartDefinition = {
  id: string;
  description?: string;
  required?: boolean;
  plain?: boolean;
  max_chars?: number;
  max_words?: number;
  condition?: {
    id: string;
    value?: any;
  };
};

export enum TemplateOptionTypes {
  boolean = 'boolean',
  string = 'string',
  choice = 'choice',
}

export type TemplateDocDefinition = {
  id: string;
  title?: string;
  description?: string;
  required?: boolean;
  condition?: {
    id: string;
    value?: any;
  };
};

export type TemplateOptionDefinition = TemplateDocDefinition & {
  type: TemplateOptionTypes;
  default?: any;
  choices?: string[];
  max_chars?: number;
};

export type TemplateYml = {
  jtex: 'v1';
  title?: string;
  description?: string;
  version?: string;
  authors?: Author[];
  license?: Licenses;
  tags?: string[];
  source?: string;
  github?: string;
  thumbnail?: string;
  build?: Record<string, any>;
  schema?: Record<string, any>;
  parts?: TemplatePartDefinition[];
  doc?: TemplateDocDefinition[];
  options?: TemplateOptionDefinition[];
  packages?: string[];
  files?: string[];
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

export type TemplateResponse = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  links: {
    self: string;
  };
};
