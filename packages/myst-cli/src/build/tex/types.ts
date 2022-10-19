export type TexExportOptions = {
  filename: string;
  template?: string | null;
  disableTemplate?: boolean;
  templateOptions?: Record<string, any>;
  clean?: boolean;
  zip?: boolean;
};
