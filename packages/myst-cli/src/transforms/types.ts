import type { Root } from 'mdast';
import type { References } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { CitationRenderer } from 'citation-js-utils';

export enum KINDS {
  Article = 'Article',
  Notebook = 'Notebook',
}

export type PreRendererData = {
  file: string;
  mdast: Root;
  kind: KINDS;
  frontmatter?: PageFrontmatter;
};

export type RendererData = PreRendererData & {
  sha256: string;
  slug?: string;
  frontmatter: PageFrontmatter;
  references: References;
};

export type SingleCitationRenderer = { id: string; render: CitationRenderer[''] };

export enum ImageExtensions {
  png = '.png',
  jpg = '.jpg',
  jpeg = '.jpeg',
  svg = '.svg',
  gif = '.gif',
  tiff = '.tiff',
  tif = '.tif',
  pdf = '.pdf',
  eps = '.eps',
  webp = '.webp',
}
