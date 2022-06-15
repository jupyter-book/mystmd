import { CitationRenderer } from 'citation-js-utils';
import { GenericNode, map } from 'mystjs';
import { KINDS } from '@curvenote/blocks';
import { PageFrontmatter } from '../frontmatter/types';
import { Root } from '../myst';

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

export type PreRendererData = {
  mdast: Root;
  kind: KINDS;
};

export type RendererData = PreRendererData & {
  sha256: string;
  frontmatter: PageFrontmatter;
  references: References;
};

export type SingleCitationRenderer = { id: string; render: CitationRenderer[''] };
