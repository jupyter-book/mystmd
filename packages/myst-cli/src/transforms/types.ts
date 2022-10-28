import type { FootnoteDefinition } from 'myst-spec';
import type { Root } from 'mdast';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { CitationRenderer } from 'citation-js-utils';

export enum KINDS {
  Article = 'Article',
  Notebook = 'Notebook',
}

type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number; doi: string | undefined }>;
};

type Footnotes = Record<string, FootnoteDefinition>;

export type References = {
  cite: Citations;
  footnotes: Footnotes;
};

export type PreRendererData = {
  file: string;
  mdast: Root;
  kind: KINDS;
};

export type RendererData = PreRendererData & {
  sha256: string;
  slug?: string;
  frontmatter: PageFrontmatter;
  references: References;
};

export type SingleCitationRenderer = { id: string; render: CitationRenderer[''] };
