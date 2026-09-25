import type { References, GenericParent } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { SourceFileKind, Dependency } from 'myst-spec-ext';
import type { CitationRenderer } from 'citation-js-utils';

export type PreRendererData = {
  file: string;
  location: string;
  mdast: GenericParent;
  kind: SourceFileKind;
  frontmatter?: PageFrontmatter;
  identifiers?: string[];
  widgets?: Record<string, any>;
};

export type RendererData = PreRendererData & {
  sha256: string;
  slug?: string;
  frontmatter: PageFrontmatter;
  references: References;
  dependencies: Dependency[];
  /** Depth of the first content heading; defaults to 2, below the page title */
  firstDepth?: number;
};

export type SingleCitationRenderer = {
  id: string;
  render: CitationRenderer[''];
  /** If remote: true, this citation was loaded from the web */
  remote?: boolean;
};
