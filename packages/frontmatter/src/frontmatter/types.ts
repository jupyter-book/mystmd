import type { Licenses } from '../licenses/types';

export enum CreditRoles {
  // https://credit.niso.org
  Conceptualization = 'Conceptualization',
  DataCuration = 'Data curation',
  FormalAnalysis = 'Formal analysis',
  FundingAcquisition = 'Funding acquisition',
  Investigation = 'Investigation',
  Methodology = 'Methodology',
  ProjectAdministration = 'Project administration',
  Resources = 'Resources',
  Software = 'Software',
  Supervision = 'Supervision',
  Validation = 'Validation',
  Visualization = 'Visualization',
  WritingOriginalDraft = 'Writing – original draft', // U+2013 hyphen is used in CRT spec
  WritingReviewEditing = 'Writing – review & editing',
}

export type AuthorRoles = CreditRoles | string;

export interface Author {
  name?: string;
  userId?: string;
  orcid?: string;
  corresponding?: boolean;
  email?: string;
  roles?: AuthorRoles[];
  affiliations?: string[];
}

export type Biblio = {
  // https://docs.openalex.org/about-the-data/work#biblio
  volume?: string | number; // sometimes you'll get fun values like "Spring" and "Inside cover."
  issue?: string | number;
  first_page?: string | number;
  last_page?: string | number;
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
  docx = 'docx',
}

export type Export = {
  format: ExportFormats;
} & Record<string, any>;

export type SiteFrontmatter = {
  title?: string;
  description?: string;
  venue?: Venue;
  keywords?: string[];
};

export type ProjectFrontmatter = SiteFrontmatter & {
  authors?: Author[];
  date?: string;
  name?: string;
  doi?: string;
  arxiv?: string;
  open_access?: boolean;
  license?: Licenses;
  github?: string;
  binder?: string;
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
  exports?: Export[];
};

export type PageFrontmatter = Omit<ProjectFrontmatter, 'intersphinx'> & {
  subtitle?: string;
  short_title?: string;
  kernelspec?: KernelSpec;
  jupytext?: Jupytext;
  tags?: string[];
  thumbnail?: string | null;
  thumbnailOptimized?: string;
};
