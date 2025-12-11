import type { RendererDoc } from 'myst-templates';

export type TexTemplateImports = {
  imports: string[];
  commands: Record<string, string>;
};

export type TypstTemplateImports = {
  macros: string[];
  commands: Record<string, string>;
};

export type TexRenderer = {
  CONTENT: string;
  doc: RendererDoc;
  options: Record<string, any>;
  parts: Record<string, string | string[]>;
  IMPORTS?: string;
};
