import type { ProjectFrontmatter } from 'myst-frontmatter';
import type { ErrorRule } from '../errorRules/types.js';

export const VERSION = 1;

export type ProjectConfig = ProjectFrontmatter & {
  remote?: string;
  index?: string;
  exclude?: string[];
  plugins?: string[];
  error_rules?: ErrorRule[];
};
