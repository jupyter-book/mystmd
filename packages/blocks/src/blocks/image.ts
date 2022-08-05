import type { JsonObject } from '../types';
import type { KINDS, BaseVersion, FileMetadata } from './types';
import { ImageFormatTypes } from './types';

// Code that has not yet been saved / versioned
export type PartialImage = {
  caption: string | null; // TODO remove once top level images caption implementation changes
  file_name: string | null;
} & FileMetadata;

// the versioned block
export interface Image extends BaseVersion, PartialImage {
  kind: typeof KINDS.Image;
}

export const defaultFormat = ImageFormatTypes.png;

export function fromDTO(json: JsonObject): PartialImage {
  return {
    size: json.size ?? 0,
    content_type: json.content_type ?? '',
    md5: json.md5 ?? '',
    caption: json.caption ?? null,
    file_name: json.file_name ?? null,
  };
}
