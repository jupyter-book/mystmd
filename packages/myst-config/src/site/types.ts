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

export const SITE_CONFIG_KEYS = {
  optional: ['projects', 'nav', 'actions', 'domains', 'favicon', 'template'].concat(
    SITE_FRONTMATTER_KEYS,
  ),
};

export type SiteTemplateOptions = Record<string, any>;

export type SiteConfig = SiteFrontmatter & {
  projects?: SiteProject[];
  nav?: (SiteNavPage | SiteNavFolder)[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
} & SiteTemplateOptions;
