export type NumberingItem = {
  enabled?: boolean;
  start?: number;
  template?: string;
};

export type Numbering = {
  enumerator?: NumberingItem; // start ignored
  all?: NumberingItem; // start and template ignored
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
