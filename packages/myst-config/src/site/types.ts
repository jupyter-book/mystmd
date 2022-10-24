import type { SiteFrontmatter } from 'myst-frontmatter';
import { SITE_FRONTMATTER_KEYS } from 'myst-frontmatter';

export interface SiteProject {
  slug: string;
  remote?: string;
  path?: string;
}

export interface SiteNavPage {
  title: string;
  url: string;
  internal?: boolean;
}

export interface SiteNavFolder {
  title: string;
  url?: string;
  children: (SiteNavPage | SiteNavFolder)[];
}

export interface SiteAction extends SiteNavPage {
  static?: boolean;
}

export interface SiteAnalytics {
  google?: string;
  plausible?: string;
}

export const SITE_CONFIG_KEYS = {
  optional: [
    'projects',
    'nav',
    'actions',
    'domains',
    'twitter',
    'logo',
    'logo_text',
    'favicon',
    'analytics',
  ].concat(SITE_FRONTMATTER_KEYS),
};

export type SiteConfig = SiteFrontmatter & {
  projects?: SiteProject[];
  nav?: (SiteNavPage | SiteNavFolder)[];
  actions?: SiteAction[];
  domains?: string[];
  twitter?: string;
  logo?: string;
  logo_text?: string;
  favicon?: string;
  analytics?: SiteAnalytics;
};
