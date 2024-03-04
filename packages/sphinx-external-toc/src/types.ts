///////// Common types ////////

/**
 * Sphinx toctree options
 **/
export type ToctreeOptions = {
  caption?: string;
  hidden?: boolean;
  maxdepth?: number;
  numbered?: boolean;
  reversed?: boolean;
  titlesonly?: boolean;
};

/**
 * Entry with a path to a single document with or without the file extension
 */
export type FileEntry = {
  file: string;
  title?: string;
};

/**
 * Entry with a URL to an external URL
 */
export type URLEntry = {
  url: string;
  title?: string;
};

/**
 * Entry with a glob for one or more document files via Unix shell-styloe wildcards
 * Similar to fnmatch, but single stars do not match slashes.
 */
export type GlobEntry = {
  glob: string;
};

///// Basic format /////

/**
 * Shorthand for a single (inline) subtree
 */
export type BasicShorthandSubtree = BasicSubtree & {
  options?: ToctreeOptions;
};

/**
 * Object which has child subtrees
 */
export type BasicHasSubtrees = {
  subtrees: BasicSubtree[];
};

/**
 * Single TOC entry
 */
export type BasicEntry = (BasicHasSubtrees | BasicShorthandSubtree | {}) &
  (FileEntry | URLEntry | GlobEntry);

/**
 * Single toctree
 */
export type BasicSubtree = ToctreeOptions & {
  entries: BasicEntry[];
};

/**
 * Basic (no format) table of contents
 */
export type BasicTOC = {
  root: string;
  defaults?: ToctreeOptions;
} & (BasicHasSubtrees | BasicShorthandSubtree | {});

/////// Article format ///////

//
/**
 * Shorthand for a single (inline) subtree
 */
export type ArticleShorthandSubtree = ArticleSubtree & {
  options?: ToctreeOptions;
};

/**
 * Object which has child subtrees
 */
export type ArticleHasSubtrees = {
  subtrees: ArticleSubtree[];
};

/**
 * Single TOC entry
 */
export type ArticleEntry = (ArticleHasSubtrees | ArticleShorthandSubtree | {}) &
  (FileEntry | URLEntry | GlobEntry);

/**
 * Single toctree
 */
export type ArticleSubtree = ToctreeOptions & {
  sections: ArticleEntry[];
};

/**
 * Article (jb-article) table of contents
 */
export type ArticleTOC = {
  format: 'jb-article';
  root: string;
  defaults?: ToctreeOptions;
} & (ArticleHasSubtrees | ArticleShorthandSubtree | {});

////// Book format //////

/**
 * Shorthand for a single outer (inline) subtree
 */
export type BookOuterShorthandSubtree = BookOuterSubtree & {
  options?: ToctreeOptions;
};

/**
 * Shorthand for a single inner (inline) subtree
 */
export type BookShorthandSubtree = BookSubtree & {
  options?: ToctreeOptions;
};

/**
 * Object which has child (outer) subtrees
 */
export type BookOuterHasSubtrees = {
  parts: BookOuterSubtree[];
};

/**
 * Object which has child (inner) subtrees
 */
export type BookHasSubtrees = {
  subtrees: BookSubtree[];
};

/**
 * Single TOC entry
 */
export type BookEntry = (BookHasSubtrees | BookShorthandSubtree | {}) &
  (FileEntry | URLEntry | GlobEntry);

/**
 * Single top-level toctree
 */
export type BookOuterSubtree = ToctreeOptions & {
  chapters: BookEntry[];
};

/**
 * Single toctree
 */
export type BookSubtree = ToctreeOptions & {
  sections: BookEntry[];
};

/**
 * Book (jb-book) table of contents
 */
export type BookTOC = {
  format: 'jb-book';
  root: string;
  defaults?: ToctreeOptions;
} & (BookOuterHasSubtrees | BookOuterShorthandSubtree | {});

export type TOC = BasicTOC | ArticleTOC | BookTOC;
