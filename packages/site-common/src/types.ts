import type { SiteAnalytics, SiteAction, SiteNavPage, SiteNavFolder } from 'myst-config';
import type { ProjectFrontmatter } from 'myst-frontmatter';
import type { Root } from 'mdast';
import type { FootnoteDefinition } from 'myst-spec';

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number; doi: string | undefined }>;
};

export type Footnotes = Record<string, FootnoteDefinition>;

export type References = {
  cite?: Citations;
  footnotes?: Footnotes;
  article?: Root;
};

export type SiteNavItem = SiteNavPage | SiteNavFolder;

export type ManifestProjectFolder = {
  title: string;
  level: number;
};

export type ManifestProjectPage = {
  slug: string;
  description?: string;
  date?: string;
  thumbnail?: string;
  thumbnailOptimized?: string;
  tags?: string[];
} & ManifestProjectFolder;

export type ManifestProject = {
  slug: string;
  index: string;
  title: string;
  pages: (ManifestProjectPage | ManifestProjectFolder)[];
  bibliography: string[]; // List of source bib files
  thumbnail?: string;
  thumbnailOptimized?: string;
  tags?: string[];
} & ProjectFrontmatter;

export type SiteManifest = {
  id?: string;
  title: string;
  twitter?: string;
  logo?: string;
  /** @deprecated */
  logoText?: string;
  logo_text?: string;
  nav: SiteNavItem[];
  actions: SiteAction[];
  projects: ManifestProject[];
  analytics?: SiteAnalytics;
};
