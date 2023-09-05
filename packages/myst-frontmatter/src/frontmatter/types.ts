import type { CreditRole } from 'credit-roles';
import type { Licenses } from '../licenses/types.js';

export interface Affiliation {
  id?: string;
  name?: string; // by default required but if only institution is provided, it's ok
  institution?: string;
  department?: string;
  address?: string;
  city?: string;
  state?: string; // or region or province
  postal_code?: string;
  country?: string;
  collaboration?: boolean;
  isni?: string;
  ringgold?: number;
  ror?: string;
  url?: string;
  email?: string;
  phone?: string;
  fax?: string;
}

export type AuthorRoles = CreditRole | string;

export interface Author {
  id?: string;
  name?: string; // or Name object?
  userId?: string;
  orcid?: string;
  corresponding?: boolean;
  equal_contributor?: boolean;
  deceased?: boolean;
  email?: string;
  roles?: AuthorRoles[];
  affiliations?: string[];
  twitter?: string;
  github?: string;
  url?: string;
  note?: string;
  phone?: string;
  fax?: string;
}

/**
 * Object to hold items referenced in multiple parts of frontmatter
 *
 * These will be normalized to the top level and replaced with ids elsewhere
 */
export type ReferenceStash = {
  affiliations?: Affiliation[];
  authors?: Author[];
};

export type Biblio = {
  // https://docs.openalex.org/about-the-data/work#biblio
  volume?: string | number; // sometimes you'll get fun values like "Spring" and "Inside cover."
  issue?: string | number;
  first_page?: string | number;
  last_page?: string | number;
};

export type Thebe = {
  lite?: boolean;
  binder?: boolean | BinderHubOptions;
  server?: boolean | JupyterServerOptions;
  kernelName?: string;
  sessionName?: string;
  disableSessionSaving?: boolean;
  mathjaxUrl?: string;
  mathjaxConfig?: string;
  local?: boolean | JupyterLocalOptions;
};

export type WellKnownRepoProviders = 'github' | 'gitlab' | 'git' | 'gist';
export type BinderProviders = WellKnownRepoProviders | string;

export type BinderHubOptions = {
  url?: string;
  ref?: string; // org-name/repo-name for WellKnownRepoProviders, url for 'meca', otherwise any string
  repo?: string;
  provider?: BinderProviders;
};

export type JupyterServerOptions = {
  url?: string;
  token?: string;
};

export type JupyterLocalOptions = JupyterServerOptions & {
  kernelName?: string;
  sessionName?: string;
};

export type Numbering = {
  enumerator?: string;
  figure?: boolean;
  equation?: boolean;
  table?: boolean;
  code?: boolean;
  heading_1?: boolean;
  heading_2?: boolean;
  heading_3?: boolean;
  heading_4?: boolean;
  heading_5?: boolean;
  heading_6?: boolean;
};

export type Venue = {
  title?: string;
  url?: string;
};

export type TextRepresentation = {
  extension?: string;
  format_name?: string;
  format_version?: string;
  jupytext_version?: string;
};

export type Jupytext = {
  formats?: string;
  text_representation?: TextRepresentation;
};

export type KernelSpec = {
  name?: string;
  language?: string;
  display_name?: string;
  argv?: string[];
  env?: Record<string, any>;
};

export enum ExportFormats {
  pdf = 'pdf',
  tex = 'tex',
  pdftex = 'pdf+tex',
  docx = 'docx',
  xml = 'xml',
  md = 'md',
  meca = 'meca',
}

export type Export = {
  format: ExportFormats;
  template?: string | null;
  output?: string;
  article?: string;
  /** sub_articles are only for jats xml export */
  sub_articles?: string[];
  /** MECA: to, from later */
} & Record<string, any>;

export type SiteFrontmatter = {
  title?: string;
  description?: string;
  subtitle?: string;
  short_title?: string;
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  authors?: Author[];
  affiliations?: Affiliation[];
  venue?: Venue;
  github?: string;
  keywords?: string[];
};

export type ProjectFrontmatter = SiteFrontmatter & {
  date?: string;
  name?: string;
  doi?: string;
  arxiv?: string;
  open_access?: boolean;
  license?: Licenses;
  binder?: string;
  source?: string;
  subject?: string;
  /** Links to bib files for citations */
  bibliography?: string[];
  /** Intersphinx and cross-project references */
  references?: Record<string, { url: string }>;
  biblio?: Biblio;
  oxa?: string;
  numbering?: boolean | Numbering;
  /** Math macros to be passed to KaTeX or LaTeX */
  math?: Record<string, string>;
  /** Abbreviations used throughout the project */
  abbreviations?: Record<string, string>;
  exports?: Export[];
  thebe?: Thebe;
  requirements?: string[];
  resources?: string[];
};

export type PageFrontmatter = Omit<ProjectFrontmatter, 'references'> & {
  kernelspec?: KernelSpec;
  jupytext?: Jupytext;
  tags?: string[];
};
