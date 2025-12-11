import type { Parent, PhrasingContent } from 'mdast';
import type { FlowContent } from './flow.js';

export interface DefinitionTerm extends Parent {
  type: 'definitionTerm';
  children: PhrasingContent[];
}
export interface DefinitionDescription extends Parent {
  type: 'definitionDescription';
  children: (FlowContent | PhrasingContent)[];
}
export interface DefinitionList extends Parent {
  type: 'definitionList';
  children: (DefinitionTerm | DefinitionDescription)[];
}
