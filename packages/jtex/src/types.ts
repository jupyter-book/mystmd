import type { Author } from '@curvenote/frontmatter';

export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export interface ISession {
  API_URL: string;
  log: Logger;
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
  frontmatter = 'frontmatter',
}
export type TemplateOptionDefinition = {
  id: string;
  type: TemplateOptionTypes;
  title?: string;
  description?: string;
  default?: any;
  required?: boolean;
  choices?: string[];
  max_chars?: number;
  condition?: {
    id: string;
    value?: any;
  };
};

export type TemplateYml = {
  metadata?: Record<string, any>;
  config?: {
    build?: Record<string, any>;
    schema?: Record<string, any>;
    parts?: TemplatePartDefinition[];
    options?: TemplateOptionDefinition[];
  };
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

export type RendererDoc = {
  title?: string;
  short_title?: string;
  description?: string;
  date: {
    day: string;
    month: string;
    year: string;
  };
  authors: RendererAuthor[];
  affiliations: ValueAndIndex[];
  bibliography?: string[];
  keywords?: string[];
};

export const REDERER_DOC_KEYS = [
  'title',
  'short_title',
  'description',
  'date',
  'authors',
  'affiliations',
  'bibliography',
  'keywords',
];

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
