import type { CreditRole } from 'credit-roles';
import type { Licenses } from '../licenses/types.js';

export type AuthorRoles = CreditRole | string;

export interface Author {
  name?: string;
  userId?: string;
  orcid?: string;
  corresponding?: boolean;
  email?: string;
  roles?: AuthorRoles[];
  affiliations?: string[];
  collaborations?: string[];
  twitter?: string;
  github?: string;
  website?: string;
}

export type Biblio = {
  // https://docs.openalex.org/about-the-data/work#biblio
  volume?: string | number; // sometimes you'll get fun values like "Spring" and "Inside cover."
  issue?: string | number;
  first_page?: string | number;
  last_page?: string | number;
};

export type Thebe = {
  lite?: boolean;
  binder?: boolean | ThebeBinderOptions;
  server?: boolean | ThebeServerOptions;
  kernelName?: string;
  sessionName?: string;
  disableSessionSaving?: boolean;
  mathjaxUrl?: string;
  mathjaxConfig?: string;
  local?: boolean | ThebeLocalOptions;
};

export enum BinderProviders {
  git = 'git',
  github = 'github',
  gitlab = 'gitlab',
}

export type ThebeBinderOptions = {
  url?: string;
  ref?: string; // org-name/repo-name
  repo?: string; // valid git refs only?
  provider?: BinderProviders;
};

export type ThebeServerOptions = {
  url?: string;
  token?: string;
};

export type ThebeLocalOptions = ThebeServerOptions & {
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
}

export type Export = {
  format: ExportFormats;
  template?: string | null;
  output?: string;
  article?: string;
  /** sub_articles are only for jats xml export */
  sub_articles?: string[];
} & Record<string, any>;

export type SiteFrontmatter = {
  title?: string;
  description?: string;
  subtitle?: string;
  short_title?: string;
  authors?: Author[];
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
  thebe?: boolean | Thebe;
};

export type PageFrontmatter = Omit<ProjectFrontmatter, 'references'> & {
  kernelspec?: KernelSpec;
  jupytext?: Jupytext;
  tags?: string[];
  thumbnail?: string | null;
  thumbnailOptimized?: string;
};
