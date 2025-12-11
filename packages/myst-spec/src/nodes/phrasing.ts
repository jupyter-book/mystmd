import type { Parent, PhrasingContent } from 'mdast';

export interface Underline extends Parent {
  type: 'underline';
  children: PhrasingContent[];
}

export interface SmallCaps extends Parent {
  type: 'smallcaps';
  children: PhrasingContent[];
}
