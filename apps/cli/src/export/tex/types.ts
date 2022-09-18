import type { Export } from 'myst-frontmatter';

export interface TexExportOptions {
  filename: string;
  multiple?: boolean;
  images?: string;
  template?: string | null;
  templatePath?: string;
  disableTemplate?: boolean;
  options?: string;
  useBuildFolder?: boolean;
  texIsIntermediate?: boolean;
  converter?: 'inkscape' | 'imagemagick';
  templateOptions?: Record<string, any>;
}

export type ExportWithOutput = Export & {
  output: string;
};
