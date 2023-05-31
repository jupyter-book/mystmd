import type { ISession as BaseISession } from 'myst-cli-utils';
import type { TemplateKind, TemplateOptionType } from 'myst-common';
import type { Author, Licenses, PageFrontmatter } from 'myst-frontmatter';
import { PAGE_FRONTMATTER_KEYS } from 'myst-frontmatter';

export interface ISession extends BaseISession {
  API_URL: string;
}

export type ValueAndIndex = {
  value: any;
  index: number;
  letter: string;
};

export type RendererAuthor = Omit<
  Author,
  'affiliations' | 'collaborations' | 'corresponding' | 'orcid'
> & {
  affiliations?: ValueAndIndex[];
  collaborations?: ValueAndIndex[];
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
  collaborations: ValueAndIndex[];
};

export const RENDERER_DOC_KEYS = ['affiliations', 'collaborations'].concat(PAGE_FRONTMATTER_KEYS);

export type TemplatePartDefinition = {
  id: string;
  title?: string;
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
  type: TemplateOptionType;
  default?: any;
  choices?: string[];
  max_chars?: number;
};

export type TemplateStyles = {
  citation?: 'numerical-only';
  bibliography?: 'natbib' | 'biblatex';
};

type TemplateYmlListPartial = {
  title?: string;
  description?: string;
  version?: string;
  authors?: Author[];
  license?: Licenses;
  tags?: string[];
};

type TemplateYmlPartial = {
  myst: 'v1';
  kind?: TemplateKind;
  github?: string;
  build?: { engine?: string; install?: string; start?: string };
  style?: TemplateStyles;
  parts?: TemplatePartDefinition[];
  doc?: TemplateDocDefinition[];
  options?: TemplateOptionDefinition[];
  packages?: string[];
  files?: string[];
};

type TemplateYmlIdLinks = {
  id: string;
  links: {
    self: string;
    download: string;
    thumbnail: string;
    source?: string;
  };
};

/**
 * Type template.yml files are directly validated against
 */
export type TemplateYml = TemplateYmlPartial &
  TemplateYmlListPartial & {
    source?: string;
    thumbnail?: string;
  };

/**
 * Type for /template/tex API list response
 */
export type TemplateYmlListResponse = {
  items: (TemplateYmlListPartial &
    TemplateYmlIdLinks & {
      kind: TemplateKind;
    })[];
};

/**
 * Type for /template/tex/org/name API response
 */
export type TemplateYmlResponse = TemplateYmlPartial & TemplateYmlListPartial & TemplateYmlIdLinks;
