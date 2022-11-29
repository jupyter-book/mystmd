import type { Author, Licenses } from 'myst-frontmatter';

export enum TemplateKind {
  tex = 'tex',
  docx = 'docx',
  site = 'site',
}

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
  jtex?: 'v1';
  myst?: 'v1';
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
