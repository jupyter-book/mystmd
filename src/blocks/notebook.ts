import {
  BlockChildDict,
  ChildId,
  BaseVersion,
  KINDS,
  Language,
  NotebookFormatTypes,
} from './types';

import { JsonObject } from '../types';
import { JupyterNotebookMetadata } from '../translators/types';

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
  launch_binder: string | null;
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
    launch_binder: json.launch_binder ?? null,
  };
}
