import type { ExportFormats, ProjectFrontmatter, SiteFrontmatter } from 'myst-frontmatter';

export interface SiteProject {
  slug?: string;
  remote?: string;
  path?: string;
}

export interface SiteNavItem {
  title: string;
  url?: string;
  internal?: boolean;
  children?: SiteNavItem[];
  static?: boolean;
}

export interface SiteAction {
  title: string;
  url: string;
  filename?: string;
  internal?: boolean;
  static?: boolean;
}

export type SiteConfig = SiteFrontmatter & {
  projects?: SiteProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
};

export type PageDownload = {
  format?: ExportFormats;
  filename: string;
  url: string;
};

type ManifestProjectItem = {
  title: string;
  short_title?: string;
  level: number;
  slug?: string;
  description?: string;
  date?: string;
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  tags?: string[];
  exports?: PageDownload[];
  downloads?: PageDownload[];
};

type ManifestProject = {
  slug?: string;
  index: string;
  title: string;
  pages: ManifestProjectItem[];
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  tags?: string[];
  downloads?: PageDownload[];
} & Omit<ProjectFrontmatter, 'downloads'>;

export type SiteManifest = SiteFrontmatter & {
  myst: string;
  id?: string;
  projects?: ManifestProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
};
