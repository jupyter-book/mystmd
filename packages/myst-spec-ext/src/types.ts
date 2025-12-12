// Search types

import { on } from 'events';

/**
 * Hierarchy of headers in a document
 */
export type DocumentHierarchy = {
  lvl1?: string;
  lvl2?: string;
  lvl3?: string;
  lvl4?: string;
  lvl5?: string;
  lvl6?: string;
};

/**
 * Base type for search records
 */
export type SearchRecordBase = {
  hierarchy: DocumentHierarchy;
  url: string;

  position: number;
};

/**
 * Record pertaining to section headings
 */
export type HeadingRecord = SearchRecordBase & {
  type: keyof DocumentHierarchy;
};

/**
 * Record pertaining to section content
 */
export type ContentRecord = SearchRecordBase & {
  type: 'content';
  content: string;
};

/**
 * Indexed search record type
 */
export type SearchRecord = HeadingRecord | ContentRecord;

export type MystSearchIndex = {
  version: '1';
  records: SearchRecord[];
};

export type * from 'myst-spec';
