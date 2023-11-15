export const SITE_FRONTMATTER_KEYS = [
  'title',
  'subtitle',
  'short_title',
  'description',
  'thumbnail',
  'thumbnailOptimized',
  'banner',
  'bannerOptimized',
  'authors',
  'contributors',
  'venue',
  'github',
  'keywords',
  'affiliations',
  'funding',
  'options',
];

export const FRONTMATTER_ALIASES = {
  author: 'authors',
  contributor: 'contributors',
  affiliation: 'affiliations',
  export: 'exports',
  jupyter: 'thebe',
  part: 'parts',
  ack: 'acknowledgments',
  acknowledgements: 'acknowledgments',
  availability: 'data_availability',
  plain_language_summary: 'summary',
  quote: 'epigraph',
  lay_summary: 'summary',
  image: 'thumbnail',
};

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
  // Do not add any project specific keys here!
  ...SITE_FRONTMATTER_KEYS,
];

export const PROJECT_FRONTMATTER_KEYS = [
  ...PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  // These keys only exist on the project
  'references',
  'requirements',
  'resources',
  'thebe',
];

export const KNOWN_PARTS = [
  'abstract',
  'summary',
  'keypoints',
  'dedication',
  'epigraph',
  'data_availability',
  'acknowledgments',
];

export const PAGE_FRONTMATTER_KEYS = [
  ...PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  // These keys only exist on the page
  'kernelspec',
  'jupytext',
  'tags',
  'parts',
  ...KNOWN_PARTS,
];

export const USE_PROJECT_FALLBACK = [
  'authors',
  'date',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'github',
  'binder',
  'source',
  'subject',
  'venue',
  'biblio',
  'numbering',
  'keywords',
  'funding',
  'affiliations',
];
