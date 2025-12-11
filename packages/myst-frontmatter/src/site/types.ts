import type { Affiliation } from '../affiliations/types.js';
import type { Contributor } from '../contributors/types.js';
import type { Funding } from '../funding/types.js';
import type { Venue } from '../venues/types.js';

export const PAGE_KNOWN_PARTS = [
  'abstract',
  'summary',
  'keypoints',
  'dedication',
  'epigraph',
  'data_availability',
  'acknowledgments',
];

export const SITE_FRONTMATTER_KEYS = [
  'title',
  'subtitle',
  'short_title',
  'description',
  'thumbnail',
  'thumbnailOptimized',
  'banner',
  'bannerOptimized',
  'tags',
  'authors',
  'reviewers',
  'editors',
  'contributors',
  'venue',
  'github',
  'keywords',
  'affiliations',
  'funding',
  'copyright',
  'options',
  'parts',
  'social',
  ...PAGE_KNOWN_PARTS,
];

export const FRONTMATTER_ALIASES = {
  author: 'authors',
  reviewer: 'reviewers',
  editor: 'editors',
  contributor: 'contributors',
  affiliation: 'affiliations',
  export: 'exports',
  download: 'downloads',
  jupyter: 'thebe',
  part: 'parts',
  ack: 'acknowledgments',
  acknowledgements: 'acknowledgments',
  acknowledgment: 'acknowledgments',
  acknowledgement: 'acknowledgments',
  availability: 'data_availability',
  dataAvailability: 'data_availability',
  'data-availability': 'data_availability',
  quote: 'epigraph',
  plain_language_summary: 'summary',
  'plain-language-summary': 'summary',
  plainLanguageSummary: 'summary',
  lay_summary: 'summary',
  'lay-summary': 'summary',
  keyPoints: 'keypoints',
  key_points: 'keypoints',
  'key-points': 'keypoints',
  image: 'thumbnail',
  identifier: 'identifiers',
  socials: 'social',
};

export type SiteFrontmatter = {
  title?: string;
  description?: string;
  subtitle?: string;
  short_title?: string;
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  authors?: Contributor[];
  tags?: string[];

  /**
   * Reviewers and editors are author/contributor ids.
   * If an object is provided for these fields, it will be moved to contributors
   * and replaced with id reference.
   */
  reviewers?: string[];
  editors?: string[];
  affiliations?: Affiliation[];
  venue?: Venue;
  github?: string;
  keywords?: string[];
  funding?: Funding[];
  copyright?: string;
  contributors?: Contributor[];
  options?: Record<string, any>;
  parts?: Record<string, string[]>;
};
