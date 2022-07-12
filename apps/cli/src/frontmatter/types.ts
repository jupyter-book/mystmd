import { Author as BlocksAuthor } from '@curvenote/blocks';
import { Licenses } from '../licenses/types';

export type Author = Partial<BlocksAuthor>;
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

export type SiteFrontmatter = {
  title?: string;
  description?: string;
  venue?: Venue;
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
  biblio?: Biblio;
  oxa?: string;
  numbering?: boolean | Numbering;
  /** Math macros to be passed to KaTeX or LaTeX */
  math?: Record<string, string>;
};

export type PageFrontmatter = ProjectFrontmatter & {
  subtitle?: string;
  short_title?: string;
  kernelspec?: KernelSpec;
  jupytext?: Jupytext;
  tags?: string[];
  thumbnail?: string | null;
};
