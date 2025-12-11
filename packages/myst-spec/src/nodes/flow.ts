import type { BlockContent, DefinitionContent } from 'mdast';
// Taken from correlating MDAST written spec with types (https://github.com/syntax-tree/mdast/tree/5.0.0?tab=readme-ov-file#flowcontent)
export type FlowContent = BlockContent | DefinitionContent;
