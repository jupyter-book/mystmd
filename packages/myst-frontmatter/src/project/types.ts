import type { PublicationMeta } from '../biblio/types.js';
import type { Download } from '../downloads/types.js';
import type { Export } from '../exports/types.js';
import type { Licenses } from '../licenses/types.js';
import type { MathMacro } from '../math/types.js';
import type { Numbering } from '../numbering/types.js';
import type { ExternalReferences } from '../references/types.js';
import type { ProjectSettings } from '../settings/types.js';
import type { SiteFrontmatter } from '../site/types.js';
import { SITE_FRONTMATTER_KEYS } from '../site/types.js';
import type { ExpandedThebeFrontmatter } from '../thebe/types.js';

export const PAGE_KNOWN_PARTS = [
  'abstract',
  'summary',
  'keypoints',
  'dedication',
  'epigraph',
  'data_availability',
  'acknowledgments',
];

export const PROJECT_AND_PAGE_FRONTMATTER_KEYS = [
  'date',
  'doi',
  'arxiv',
  'pmid',
  'pmcid',
  'open_access',
  'license',
  'binder',
  'source',
  'subject',
  'volume',
  'issue',
  'first_page',
  'last_page',
  'oxa',
  'numbering',
  'bibliography',
  'math',
  'abbreviations',
  'exports',
  'downloads',
  'settings', // We maybe want to move this into site frontmatter in the future
  'parts',
  ...PAGE_KNOWN_PARTS,
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
  'toc',
];

export type ProjectAndPageFrontmatter = SiteFrontmatter & {
  date?: string;
  doi?: string;
  arxiv?: string;
  pmid?: number;
  pmcid?: string;
  open_access?: boolean;
  license?: Licenses;
  binder?: string;
  source?: string;
  subject?: string;
  /** Links to bib files for citations */
  bibliography?: string[];
  volume?: PublicationMeta;
  issue?: PublicationMeta;
  first_page?: string | number;
  last_page?: string | number;
  oxa?: string;
  numbering?: Numbering;
  /** Math macros to be passed to KaTeX or LaTeX */
  math?: Record<string, MathMacro>;
  /** Abbreviations used throughout the project */
  abbreviations?: Record<string, string | null>;
  exports?: Export[];
  downloads?: Download[];
  settings?: ProjectSettings;
  parts?: Record<string, string[]>;
};

export type ProjectFrontmatter = ProjectAndPageFrontmatter & {
  id?: string;
  /** Intersphinx and MyST cross-project references */
  references?: ExternalReferences;
  requirements?: string[];
  resources?: string[];
  thebe?: ExpandedThebeFrontmatter;
  toc?: any[];
};
