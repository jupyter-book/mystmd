import type { Biblio } from '../biblio/types.js';
import type { Export } from '../exports/types.js';
import type { Licenses } from '../licenses/types.js';
import type { Numbering } from '../numbering/types.js';
import type { SiteFrontmatter } from '../site/types.js';
import type { Thebe } from '../thebe/types.js';

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
