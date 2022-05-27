import { Frontmatter } from '../frontmatter/types';

export type ProjectConfig = {
  title: string;
  description?: string | null;
  frontmatter?: Omit<Frontmatter, 'title' | 'description'>;
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

export type SiteConfig = {
  title: string;
  frontmatter?: Omit<Frontmatter, 'title' | 'description'>;
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
};

export type Config = {
  version: 1;
  project?: ProjectConfig;
  site?: SiteConfig;
};
