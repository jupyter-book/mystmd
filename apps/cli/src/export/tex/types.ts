import type { TexExportOptions } from 'myst-cli';

export type TexExportOptionsExpanded = TexExportOptions & {
  multiple?: boolean;
  templatePath?: string;
  options?: string;
  useBuildFolder?: boolean;
  texIsIntermediate?: boolean;
  converter?: 'inkscape' | 'imagemagick';
  images?: string;
};
