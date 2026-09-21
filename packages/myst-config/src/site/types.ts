import type { FrontmatterParts } from 'myst-common';
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
  format?: ExportFormats;
  internal?: boolean;
  static?: boolean;
}

export type SiteConfig = SiteFrontmatter & {
  /**
   * Multiple projects per site is deprecated; a site maps 1:1 to a project.
   * See https://github.com/jupyter-book/mystmd/issues/1103
   * TODO: Clean up the `projects` API to clarify that it's only one allowed.
   */
  projects?: SiteProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  template?: string;
};

export type SiteExport = {
  url: string;
  filename: string;
  format?: ExportFormats;
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
  enumerator?: string;
  // For external URLs
  url?: string;
  open_in_same_tab?: boolean;
};

type ManifestProject = {
  slug?: string;
  index: string;
  enumerator?: string;
  title: string;
  pages: ManifestProjectItem[];
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  tags?: string[];
  downloads?: SiteAction[];
  exports?: SiteExport[];
  parts?: FrontmatterParts;
} & Omit<ProjectFrontmatter, 'downloads' | 'exports' | 'parts'>;

export type SiteManifest = Omit<SiteFrontmatter, 'parts'> & {
  version: number;
  myst: string;
  id?: string;
  /**
   * Multiple projects per site is deprecated; a site maps 1:1 to a project.
   * See https://github.com/jupyter-book/mystmd/issues/1103
   * TODO: Clean up the `projects` API to clarify that it's only one allowed.
   */
  projects?: ManifestProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
  parts?: FrontmatterParts;
};
