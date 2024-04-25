/**
 * Common attributes for all TOC items
 * Should be taken as a Partial<>
 */
export type CommonEntry = {
  title?: string;
  hidden?: boolean;
  numbering?: string;
  id?: string;
  part?: string;
};

/**
 * Entry that groups children, with no associated document
 */
export type ParentEntry = {
  children: Entry[];
  title: string;
  class?: string;
} & CommonEntry;

/**
 * Entry with a path to a single document with or without the file extension
 */
export type FileEntry = {
  file: string;
} & CommonEntry;

/**
 * Entry with a URL to an external URL
 */
export type URLEntry = {
  url: string;
} & CommonEntry;

/**
 * Entry representing several documents through a glob
 */
export type PatternEntry = {
  pattern: string;
} & CommonEntry;

/**
 * Entry representing a single document
 */
export type DocumentEntry = FileEntry | URLEntry;

/**
 * All possible types of Entry
 */
export type Entry =
  | DocumentEntry
  | (DocumentEntry & Omit<ParentEntry, 'title'>)
  | PatternEntry
  | ParentEntry;

export type TOC = Entry[];
