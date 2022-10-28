import type { ExportOptions } from 'myst-cli';

export type TexExportOptionsExpanded = ExportOptions & {
  multiple?: boolean;
  templatePath?: string;
  options?: string;
  useBuildFolder?: boolean;
  texIsIntermediate?: boolean;
  converter?: 'inkscape' | 'imagemagick';
  images?: string;
};
