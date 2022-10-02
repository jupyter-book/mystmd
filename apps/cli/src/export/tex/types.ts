export type TexExportOptions = {
  filename: string;
  template?: string | null;
  disableTemplate?: boolean;
  templateOptions?: Record<string, any>;
  clean?: boolean;
  zip?: boolean;
};

export type TexExportOptionsExpanded = TexExportOptions & {
  multiple?: boolean;
  templatePath?: string;
  options?: string;
  useBuildFolder?: boolean;
  texIsIntermediate?: boolean;
  converter?: 'inkscape' | 'imagemagick';
  images?: string;
};
