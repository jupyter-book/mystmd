import type {
  Parent,
  TableCell as SpecTableCell,
  FootnoteReference as FNR,
  FootnoteDefinition as FND,
} from 'myst-spec';

export type Delete = Parent & { type: 'delete' };
export type Underline = Parent & { type: 'underline' };
export type Smallcaps = Parent & { type: 'smallcaps' };
export type DefinitionTerm = Parent & { type: 'definitionTerm' };
export type DefinitionDescription = Parent & { type: 'definitionDescription' };
export type DefinitionList = Parent & {
  type: 'definitionList';
  children: (DefinitionTerm | DefinitionDescription)[];
};
export type CaptionNumber = Parent & {
  type: 'captionNumber';
  kind: string;
  label: string;
  identifier: string;
  html_id: string;
  enumerator: string;
};

export type FootnoteDefinition = FND & {
  /** @deprecated this should be enumerator */
  number?: number;
};

export type FootnoteReference = FNR & {
  /** @deprecated this should be enumerator */
  number?: number;
};

export type TableCell = SpecTableCell & { colspan?: number; rowspan?: number; width?: number };
