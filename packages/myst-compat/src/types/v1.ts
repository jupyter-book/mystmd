// TODO: use mdast once we rely on mdast types

export type FootnoteDefinition = {
  type: 'footnoteDefinition';
  children: any[];
  html_id?: string;
  label?: string;
  identifier?: string;
  number?: number;
};

export type FootnoteReference = {
  type: 'footnoteReference';
  html_id?: string;
  label?: string;
  identifier?: string;
  number?: number;
};
