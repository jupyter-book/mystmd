export type ParentEntry = {
  children: Entry[];
  title: string;
  class?: string;
}

/**
 * Entry with a path to a single document with or without the file extension
 */
export type FileEntry = {
  file: string;
  title?: string;
} & Partial<ParentEntry>;

/**
 * Entry with a URL to an external URL
 */
export type URLEntry = {
  url: string;
  title?: string;
} & Partial<ParentEntry>;



/**
 * Single TOC entry
 */
export type Entry = FileEntry | URLEntry | ParentEntry;


export type TOC = Entry[];
