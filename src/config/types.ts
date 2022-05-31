import { ProjectFrontmatter, SiteFrontmatter } from '../frontmatter/types';

export const CURVENOTE_YML = 'curvenote.yml';
export const VERSION = 1;

export type ProjectConfig = ProjectFrontmatter & {
  remote?: string;
  index?: string;
  exclude?: string[];
};

export type SiteProject = {
  path: string;
  slug: string;
};

export type SiteNavPage = {
  title: string;
  url: string;
};

export type SiteNavFolder = {
  title: string;
  children: SiteNavItem[];
};

export type SiteNavItem = SiteNavPage | SiteNavFolder;

export type SiteAction = SiteNavPage & {
  static?: boolean;
};

export type AnalyticsConfig = {
  google?: string;
  plausible?: string;
};

export type SiteConfig = SiteFrontmatter & {
  twitter?: string;
  domains: string[];
  logo?: string | null;
  logoText?: string;
  favicon?: string;
  buildPath?: string;
  design?: {
    hide_authors?: boolean;
  };
  projects: SiteProject[];
  nav: SiteNavItem[];
  actions: SiteAction[];
  analytics?: AnalyticsConfig;
};

export type Config = {
  version: 1;
  project?: ProjectConfig;
  site?: SiteConfig;
};
