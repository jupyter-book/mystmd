import type { RendererDoc } from 'myst-templates';

export type GlossaryDirective = {
  key: string;
  name: string;
  description: string;
};

export type TemplateImports = {
  imports: string[];
  commands: Record<string, string>;
};

export type TexRenderer = {
  CONTENT: string;
  doc: RendererDoc;
  options: Record<string, any>;
  parts: Record<string, string>;
  IMPORTS?: string;
};
