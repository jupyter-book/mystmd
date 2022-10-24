import type { Export } from 'myst-frontmatter';

export type ExportWithOutput = Export & {
  output: string;
};
