import type { TOC } from 'myst-toc';

export enum ExportFormats {
  pdf = 'pdf',
  tex = 'tex',
  pdftex = 'pdf+tex',
  typst = 'typst',
  docx = 'docx',
  xml = 'xml',
  md = 'md',
  ipynb = 'ipynb',
  meca = 'meca',
  cff = 'cff',
}

export type ExportArticle = {
  file?: string;
  level?: number;
  title?: string;
  // Page frontmatter defined here will override file frontmatter
} & Record<string, any>;

export type Export = {
  id?: string;
  format?: ExportFormats;
  template?: string | null;
  output?: string;
  zip?: boolean;
  toc?: TOC;
  articles?: ExportArticle[];
  top_level?: 'parts' | 'chapters' | 'sections';
  /** sub_articles are only for jats xml export */
  sub_articles?: string[];
  /** MECA: to, from later */
  /** tocFile is not set by user; it will be set instead of `toc` when user provides a string for `toc`*/
  tocFile?: string;
} & Record<string, any>;
