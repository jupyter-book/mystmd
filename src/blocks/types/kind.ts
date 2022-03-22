export enum KINDS {
  Content = 'Content',
  Article = 'Article',
  Code = 'Code',
  Notebook = 'Notebook',
  Output = 'Output',
  Image = 'Image',
  Navigation = 'Navigation',
  Reference = 'Reference',
}

// Note this is also in schema as `ReferenceKind`
export enum CustomizableReferenceKind {
  sec = 'sec',
  fig = 'fig',
  eq = 'eq',
  code = 'code',
  table = 'table',
}

export const DocumentKINDS = new Set([KINDS.Article, KINDS.Notebook]);

export const EditableKINDS = new Set([
  KINDS.Article,
  KINDS.Notebook,
  KINDS.Content,
  KINDS.Navigation,
]);
