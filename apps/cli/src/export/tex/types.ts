export interface TexExportOptions {
  filename: string;
  multiple?: boolean;
  images?: string;
  template?: string;
  templatePath?: string;
  disableTemplate?: boolean;
  options?: string;
  useBuildFolder?: boolean;
  texIsIntermediate?: boolean;
  converter?: 'inkscape' | 'imagemagick';
  templateOptions?: Record<string, any>;
}
