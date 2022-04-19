import { GenericNode, MyST, map } from 'mystjs';
import { CitationRenderer } from 'citation-js-utils';
import { Frontmatter } from '../frontmatter';
import { IDocumentCache } from '../types';

export type Root = ReturnType<typeof MyST.prototype.parse>;
export type MapResult = ReturnType<typeof map>;

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number; doi: string | undefined }>;
};

export type Footnotes = Record<string, GenericNode>;

export type References = {
  cite: Citations;
  footnotes: Footnotes;
};

export type TransformState = {
  frontmatter: Frontmatter;
  references: References;
  citeRenderer: CitationRenderer;
  cache: IDocumentCache;
};
