import type { Jupytext } from '../jupytext/types.js';
import type { KernelSpec } from '../kernelspec/types.js';
import type { ProjectAndPageFrontmatter } from '../project/types.js';

export type PageFrontmatter = ProjectAndPageFrontmatter & {
  kernelspec?: KernelSpec;
  jupytext?: Jupytext;
  tags?: string[];
  parts?: Record<string, string[]>;
  /** Flag if frontmatter title is duplicated in content
   *
   * Set during initial file/frontmatter load
   */
  content_includes_title?: boolean;
};
