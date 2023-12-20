export enum ExportFormats {
  pdf = 'pdf',
  tex = 'tex',
  pdftex = 'pdf+tex',
  typst = 'typst',
  docx = 'docx',
  xml = 'xml',
  md = 'md',
  meca = 'meca',
}

export type Export = {
  format: ExportFormats; // TODO: Optional if template is defined
  template?: string | null;
  output?: string;
  articles?: string[];
  /** sub_articles are only for jats xml export */
  sub_articles?: string[];
  /** MECA: to, from later */
} & Record<string, any>;
