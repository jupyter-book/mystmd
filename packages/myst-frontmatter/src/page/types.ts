import type { Jupytext } from '../jupytext/types.js';
import type { KernelSpec } from '../kernelspec/types.js';
import type { ProjectAndPageFrontmatter } from '../project/types.js';

export type PageFrontmatter = ProjectAndPageFrontmatter & {
  kernelspec?: KernelSpec;
  jupytext?: Jupytext;
  tags?: string[];
  parts?: Record<string, string>;
  // Known parts - these values are duplicated to 'parts' object on validation
  abstract?: string;
  data_availability?: string;
};
