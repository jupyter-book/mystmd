/**
 * Common attributes for all TOC items
 * Should be taken as a Partial<>
 */
export type CommonEntry = {
  title?: string;
  // hidden?: boolean;
  // numbering?: string;
  // id?: string;
  // class?: string;
};

/**
 * Entry that groups children, with no associated document
 */
export type ParentEntry = {
  children: Entry[];
  title: string;
} & CommonEntry;

/**
 * Entry with a path to a single document with or without the file extension
 */
export type FileEntry = {
  file: string;
} & CommonEntry;

/**
 * Entry with a path to a single document with or without the file extension,
 * and an array of children
 */
export type FileParentEntry = FileEntry & Omit<ParentEntry, 'title'>;

/**
 * Entry with a url to an external resource
 */
export type URLEntry = {
  url: string;
} & CommonEntry;

/**
 * Entry with a url to an external resource,
 * and an array of children
 */
export type URLParentEntry = URLEntry & Omit<ParentEntry, 'title'>;

/**
 * Entry representing several documents through a glob
 */
export type PatternEntry = {
  pattern: string;
} & CommonEntry;

/**
 * All possible types of Entry
 */
export type Entry =
  | FileEntry
  | URLEntry
  | FileParentEntry
  | URLParentEntry
  | PatternEntry
  | ParentEntry;

export type TOC = Entry[];
