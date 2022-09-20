import type {
  KINDS,
  SiteAnalytics,
  SiteAction,
  SiteNavPage,
  SiteNavFolder,
} from '@curvenote/blocks';
import type { PageFrontmatter, ProjectFrontmatter } from 'myst-frontmatter';
import type { Root } from 'mdast';
import type { FootnoteDefinition } from 'myst-spec';

export enum Theme {
  light = 'light',
  dark = 'dark',
}

export type Heading = {
  slug?: string;
  path?: string;
  title: string;
  level: number | 'index';
  group?: string;
};

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

export type NavigationLink = {
  group?: string;
  title: string;
  url: string;
};

export type FooterLinks = {
  navigation?: {
    prev?: NavigationLink;
    next?: NavigationLink;
  };
};

export type DocumentLoader = {
  theme: Theme;
  config?: SiteManifest;
};

export type PageLoader = {
  kind: KINDS;
  file: string;
  sha256: string;
  slug: string;
  domain: string; // This is written in at render time in the site
  frontmatter: PageFrontmatter;
  mdast: Root;
  references: References;
  footer?: FooterLinks;
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
