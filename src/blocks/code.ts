import { JsonObject } from '../types';
import {
  KINDS,
  Language,
  BaseVersion,
  VersionId,
  TARGET,
  CodeFormatTypes,
  JupyterCellMetadata,
} from './types';

// Code that has not yet been saved / versioned
export interface PartialCode {
  targets: TARGET[];
  content: string;
  language: Language;
  metadata: {
    jupyter?: JupyterCellMetadata;
  };
  execution_count: number | null | undefined;
  output: VersionId | null;
}

// the versioned block
export interface Code extends BaseVersion, PartialCode {
  kind: typeof KINDS.Code;
}

export const defaultFormat = CodeFormatTypes.txt;

export function fromDTO(json: JsonObject): PartialCode {
  return {
    targets: json.targets ?? [],
    content: json.content ?? '',
    language: json.language ?? '',
    metadata: { ...json.metadata },
    execution_count: json.execution_count ?? 0,
    output: json.output ?? null,
  };
}
