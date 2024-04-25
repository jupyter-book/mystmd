/**
 * Common attributes for all TOC items
 * Should be taken as a Partial<>
 */
export type CommonEntry = {
  title: string;
  hidden: boolean;
  numbering: string;
  id: string;
  part: string;
};

/**
 * Entry that groups children, with no associated document
 */
export type ParentEntry = {
  children: Entry[];
  title: string;
  class?: string;
} & Partial<Omit<CommonEntry, 'title'>>;

/**
 * Entry with a path to a single document with or without the file extension
 */
export type FileEntry = {
  file: string;
} & Partial<ParentEntry>;

/**
 * Entry with a URL to an external URL
 */
export type URLEntry = {
  url: string;
} & Partial<ParentEntry>;

/**
 * Entry representing several documents through a glob
 */
export type PatternEntry = {
  pattern: string;
} & Partial<CommonEntry>;

/**
 * Single TOC entry
 */
export type Entry = FileEntry | URLEntry | PatternEntry | ParentEntry;

export type TOC = Entry[];
