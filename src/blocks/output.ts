import {
  KINDS,
  BaseVersion,
  TARGET,
  OutputFormatTypes,
  FileMetadata,
  OutputSummaryEntry,
} from './types';
import { JsonObject } from '../types';

export function outputSummaryFromDTO(json: JsonObject): OutputSummaryEntry {
  return {
    kind: json.kind,
    content_type: json.content_type,
    content: json.content,
    link: json.link,
    path: json.path ?? undefined,
    alternate: json.alternate ?? {},
  };
}

export type PartialOutput = {
  targets: TARGET[];
  outputs: OutputSummaryEntry[];
  original?: JsonObject[]; // handling temp state on ext client
  upload_path?: string; // upload DTO is not the same at Download DTO
} & FileMetadata;

export interface Output extends BaseVersion, PartialOutput {
  kind: typeof KINDS.Output;
}

export const defaultFormat = OutputFormatTypes.jupyter;

export function fromDTO(json: JsonObject): PartialOutput {
  return {
    targets: json.targets ?? [],
    original: json.original,
    outputs: json.outputs ? json.outputs.map((f: JsonObject) => outputSummaryFromDTO(f)) : [],
    size: json.size ?? 0,
    content_type: json.content_type ?? '',
    md5: json.md5 ?? '',
  };
}
