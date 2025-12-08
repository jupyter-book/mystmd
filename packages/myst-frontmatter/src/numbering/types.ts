export type NumberingItem = {
  enabled?: boolean;
  start?: number;
  enumerator?: string;
  template?: string;
  continue?: boolean;
  offset?: number; // only applies to title
};

export type Numbering = {
  enumerator?: NumberingItem; // start, enabled, continue, and template ignored
  all?: NumberingItem; // start, template, enumerator ignored
  title?: NumberingItem; // start, continue, and template ignored
  figure?: NumberingItem;
  subfigure?: NumberingItem;
  equation?: NumberingItem;
  subequation?: NumberingItem;
  table?: NumberingItem;
  code?: NumberingItem;
  heading_1?: NumberingItem;
  heading_2?: NumberingItem;
  heading_3?: NumberingItem;
  heading_4?: NumberingItem;
  heading_5?: NumberingItem;
  heading_6?: NumberingItem;
} & Record<string, NumberingItem>;
