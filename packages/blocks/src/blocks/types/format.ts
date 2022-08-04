export enum ContentFormatTypes {
  txt = 'txt',
  html = 'html',
  md = 'md',
  rst = 'rst',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
  json = 'json',
  jupyter = 'jupyter',
}

export enum CodeFormatTypes {
  txt = 'txt',
  md = 'md',
  rst = 'rst',
  jupyter = 'jupyter',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
}

export enum ReferenceFormatTypes {
  txt = 'txt',
  bibtex = 'bibtex',
  html = 'html',
  json = 'json',
}

export enum CitationStyles {
  apa = 'apa',
  vancouver = 'vancouver',
  harvard = 'harvard',
}

export enum OutputFormatTypes {
  jupyter = 'jupyter',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
}

export enum ArticleFormatTypes {
  txt = 'txt',
  html = 'html',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
  jupyter = 'jupyter',
  md = 'md',
  pdf = 'pdf',
  docx = 'docx',
}

export enum NotebookFormatTypes {
  jupyter = 'jupyter',
  pdf = 'pdf',
}

export enum ImageFormatTypes {
  png = 'png',
  gif = 'gif',
}

export enum NavigationFormatTypes {
  json = 'json',
}

export const FormatSet = new Set([
  'txt',
  'html',
  'md',
  'rst',
  'tex',
  'tex:curvenote',
  'json',
  'jupyter',
  'bibtex',
  'pdf',
  'docx',
]);

export type FormatTypes =
  | ContentFormatTypes
  | CodeFormatTypes
  | OutputFormatTypes
  | ArticleFormatTypes
  | NotebookFormatTypes
  | ImageFormatTypes
  | NavigationFormatTypes
  | ReferenceFormatTypes;

export type ExportableFormatTypes =
  | ArticleFormatTypes.tex
  | ArticleFormatTypes.pdf
  | ArticleFormatTypes.docx;
