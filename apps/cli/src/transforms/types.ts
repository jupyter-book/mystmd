import type { CitationRenderer } from 'citation-js-utils';
import type { map } from 'mystjs';
import type { KINDS } from '@curvenote/blocks';
import type { References as SiteReferences } from '@curvenote/site-common';
import type { PageFrontmatter } from '../frontmatter/types';
import type { Root } from '../myst';

export type MapResult = ReturnType<typeof map>;

export type { Citations, Footnotes } from '@curvenote/site-common';

export type References = Required<SiteReferences>;

export type PreRendererData = {
  file: string;
  mdast: Root;
  kind: KINDS;
};

export type RendererData = PreRendererData & {
  sha256: string;
  slug: string;
  frontmatter: PageFrontmatter;
  references: References;
};

export type SingleCitationRenderer = { id: string; render: CitationRenderer[''] };
