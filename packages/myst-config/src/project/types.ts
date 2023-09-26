import type { ProjectFrontmatter } from 'myst-frontmatter';

export const VERSION = 1;

export type ProjectConfig = ProjectFrontmatter & {
  remote?: string;
  index?: string;
  exclude?: string[];
  plugins?: string[];
};
