import { JsonObject } from '../types';
import { KINDS, BaseVersion, TARGET, ContentFormatTypes, JupyterCellMetadata } from './types';

export interface PartialContent {
  targets: TARGET[];
  content: string;
  metadata: {
    jupyter?: JupyterCellMetadata;
  };
}

export interface Content extends BaseVersion, PartialContent {
  kind: typeof KINDS.Content;
  format: ContentFormatTypes;
}

export const defaultFormat = ContentFormatTypes.html;

export function fromDTO(json: JsonObject): PartialContent {
  return {
    targets: json.targets ?? [],
    content: json.content ?? '',
    metadata: { ...json.metadata },
  };
}
