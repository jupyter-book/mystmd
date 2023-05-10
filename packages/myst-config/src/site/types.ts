import type { Export, ProjectFrontmatter, SiteFrontmatter } from 'myst-frontmatter';
import { SITE_FRONTMATTER_KEYS } from 'myst-frontmatter';

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

export const SITE_CONFIG_KEYS = {
  optional: ['projects', 'nav', 'actions', 'domains', 'favicon', 'template'].concat(
    SITE_FRONTMATTER_KEYS,
  ),
};

export type SiteTemplateOptions = Record<string, any>;

export type SiteConfig = SiteFrontmatter & {
  projects?: SiteProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
} & SiteTemplateOptions;

type ManifestProjectItem = {
  title: string;
  short_title?: string;
  level: number;
  slug?: string;
  description?: string;
  date?: string;
  thumbnail?: string;
  thumbnailOptimized?: string;
  tags?: string[];
  exports?: Export[];
};

type ManifestProject = {
  slug?: string;
  index: string;
  title: string;
  pages: ManifestProjectItem[];
  thumbnail?: string;
  thumbnailOptimized?: string;
  tags?: string[];
} & ProjectFrontmatter;

export type SiteManifest = SiteFrontmatter & {
  myst: 'v1';
  id?: string;
  projects?: ManifestProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
} & SiteTemplateOptions;
