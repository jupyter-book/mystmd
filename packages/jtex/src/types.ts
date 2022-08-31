import type { Author } from '@curvenote/frontmatter';

export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export interface ISession {
  API_URL: string;
  log: Logger;
}

type MinMax = {
  min: number;
  max: number;
};

export type TemplateTagDefinition = {
  id: string;
  // tag: string;
  description?: string;
  required?: boolean;
  plain?: boolean;
  chars?: MinMax;
  words?: MinMax;
  // condition
};

export enum TEMPLATE_OPTION_TYPES {
  bool = 'bool',
  str = 'str',
  choice = 'choice',
}

export type TemplateOptionDefinition = {
  id: string;
  type: TEMPLATE_OPTION_TYPES;
  title?: string;
  description?: string;
  default?: any;
  required?: boolean;
  multiple?: boolean;
  choices?: string[];
  // condition
};

export type TemplateYml = {
  metadata?: Record<string, any>;
  config?: {
    build?: Record<string, any>;
    schema?: Record<string, any>;
    tagged?: TemplateTagDefinition[];
    options?: TemplateOptionDefinition[];
  };
};

type NameAndIndex = {
  name: string;
  index: number;
};

type RendererAuthor = Omit<Author, 'affiliations'> & {
  affiliations?: NameAndIndex[];
  index: number;
};

export type RendererDoc = {
  title: string;
  description: string;
  date: {
    day: string;
    month: string;
    year: string;
  };
  authors: RendererAuthor[];
  affiliations: NameAndIndex[];
  keywords?: string[];
};

export type Renderer = {
  CONTENT: string;
  doc: RendererDoc;
  options: Record<string, any>;
  tagged: Record<string, string>;
};
