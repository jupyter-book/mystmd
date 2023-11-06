import type { ProjectFrontmatter } from '../project/types.js';

export type TextRepresentation = {
  extension?: string;
  format_name?: string;
  format_version?: string;
  jupytext_version?: string;
};

export type Jupytext = {
  formats?: string;
  text_representation?: TextRepresentation;
};

export type KernelSpec = {
  name?: string;
  language?: string;
  display_name?: string;
  argv?: string[];
  env?: Record<string, any>;
};

export type PageFrontmatter = Omit<ProjectFrontmatter, 'references'> & {
  kernelspec?: KernelSpec;
  jupytext?: Jupytext;
  tags?: string[];
};
