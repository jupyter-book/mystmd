import type { CitationRenderer } from 'citation-js-utils';
import type { KINDS } from '@curvenote/blocks';
import type { References as SiteReferences } from '@curvenote/site-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { Root } from 'mdast';

export type { Citations, Footnotes } from '@curvenote/site-common';

export type References = Required<Omit<SiteReferences, 'article'>>;

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
