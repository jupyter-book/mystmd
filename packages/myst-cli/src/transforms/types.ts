import type { Root } from 'mdast';
import type { References, SourceFileKind, Dependency } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { CitationRenderer } from 'citation-js-utils';

export type PreRendererData = {
  file: string;
  mdast: Root;
  kind: SourceFileKind;
  frontmatter?: PageFrontmatter;
};

export type RendererData = PreRendererData & {
  sha256: string;
  slug?: string;
  frontmatter: PageFrontmatter;
  references: References;
  dependencies: Dependency[];
};

export type SingleCitationRenderer = { id: string; render: CitationRenderer[''] };
