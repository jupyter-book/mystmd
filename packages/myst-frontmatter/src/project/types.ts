import type { Biblio } from '../biblio/types.js';
import type { Export } from '../exports/types.js';
import type { Licenses } from '../licenses/types.js';
import type { Numbering } from '../numbering/types.js';
import type { ProjectSettings } from '../settings/types.js';
import type { SiteFrontmatter } from '../site/types.js';
import { SITE_FRONTMATTER_KEYS } from '../site/validators.js';
import type { ExpandedThebeFrontmatter } from '../thebe/types.js';

export const PROJECT_AND_PAGE_FRONTMATTER_KEYS = [
  'date',
  'name',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'binder',
  'source',
  'subject',
  'biblio',
  'oxa',
  'numbering',
  'bibliography',
  'math',
  'abbreviations',
  'exports',
  'settings', // We maybe want to move this into site frontmatter in the future
  // Do not add any project specific keys here!
  ...SITE_FRONTMATTER_KEYS,
];

export const PROJECT_FRONTMATTER_KEYS = [
  ...PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  // These keys only exist on the project
  'id',
  'references',
  'requirements',
  'resources',
  'thebe',
];

export type ProjectAndPageFrontmatter = SiteFrontmatter & {
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
  biblio?: Biblio;
  oxa?: string;
  numbering?: boolean | Numbering;
  /** Math macros to be passed to KaTeX or LaTeX */
  math?: Record<string, string>;
  /** Abbreviations used throughout the project */
  abbreviations?: Record<string, string>;
  exports?: Export[];
  settings?: ProjectSettings;
};

export type ProjectFrontmatter = ProjectAndPageFrontmatter & {
  id?: string;
  /** Intersphinx and cross-project references */
  references?: Record<string, { url: string }>;
  requirements?: string[];
  resources?: string[];
  thebe?: ExpandedThebeFrontmatter;
};
