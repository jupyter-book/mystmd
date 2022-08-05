import type { ProjectFrontmatter, SiteFrontmatter } from '../frontmatter/types';

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

export type SiteAnalytics = {
  google?: string;
  plausible?: string;
};

export type SiteDesign = {
  hide_authors?: boolean;
};

export type SiteConfig = SiteFrontmatter & {
  projects: SiteProject[];
  nav: SiteNavItem[];
  actions: SiteAction[];
  domains: string[];
  twitter?: string;
  logo?: string;
  logoText?: string;
  favicon?: string;
  buildPath?: string;
  analytics?: SiteAnalytics;
  design?: SiteDesign;
};

export type Config = {
  version: 1;
  project?: ProjectConfig;
  site?: SiteConfig;
};
