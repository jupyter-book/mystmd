import { JsonObject } from '../types';
import { KINDS, BaseVersion, ImageFormatTypes, FileMetadata } from './types';

// Code that has not yet been saved / versioned
export type PartialImage = {
  caption: string | null;
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
