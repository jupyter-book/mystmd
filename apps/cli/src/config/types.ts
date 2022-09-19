import type { ProjectFrontmatter } from 'myst-frontmatter';
import type { SiteConfig } from '@curvenote/blocks';

export const CURVENOTE_YML = 'curvenote.yml';
export const VERSION = 1;

export type ProjectConfig = ProjectFrontmatter & {
  remote?: string;
  index?: string;
  exclude?: string[];
};

export type Config = {
  version: 1;
  project?: ProjectConfig;
  site?: SiteConfig;
};
