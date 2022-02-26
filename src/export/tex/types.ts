export interface TexExportOptions {
  filename: string;
  multiple?: boolean;
  images?: string;
  template?: string;
  templatePath?: string;
  options?: string;
  useBuildFolder?: boolean;
  texIsIntermediate?: boolean;
  converter?: 'inkscape' | 'imagemagick';
}
