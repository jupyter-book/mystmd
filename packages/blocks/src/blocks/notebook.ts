import type {
  BlockChildDict,
  ChildId,
  BaseVersion,
  KINDS,
  Language,
  JupyterNotebookMetadata,
} from './types';
import { NotebookFormatTypes } from './types';

import type { JsonObject } from '../types';

export interface NotebookBlockMetadata extends JupyterNotebookMetadata {
  nbformat: number;
  nbformat_minor: number;
  [index: string]: any;
}

export interface PartialNotebook {
  language: Language;
  metadata: NotebookBlockMetadata;
  order: ChildId[];
  children: BlockChildDict;
}

export const defaultFormat = NotebookFormatTypes.jupyter;

export interface Notebook extends BaseVersion, PartialNotebook {
  kind: typeof KINDS.Notebook;
}

export function fromDTO(json: JsonObject): PartialNotebook {
  return {
    language: json.language ?? '',
    metadata: json.metadata ?? {},
    order: [...(json?.order ?? [])],
    children: { ...json.children },
  };
}
