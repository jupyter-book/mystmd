import { KINDS, BaseVersion, TARGET, OutputFormatTypes, FileMetadata } from './types';
import { JsonObject } from '../types';
import { CellOutputMimeTypes } from '../translators/types';

export enum OutputSummaryKind {
  'stream' = 'stream',
  'text' = 'text',
  'error' = 'error',
  'image' = 'image',
  'svg' = 'svg',
  'html' = 'html',
  'latex' = 'latex',
  'json' = 'json',
  'javascript' = 'javascript',
  'plotly' = 'plotly',
  'bokeh' = 'bokeh',
  'ipywidgets' = 'ipywidgets',
  'unknown' = 'unknown',
}

export interface OutputSummaryEntry {
  kind: OutputSummaryKind;
  content_type: CellOutputMimeTypes;
  content?: string;
  link?: string;
}

export type OutputSummary = OutputSummaryEntry & {
  alternate: Partial<Record<OutputSummaryKind, OutputSummaryEntry>>;
};

export function outputSummaryFromDTO(json: JsonObject): OutputSummary {
  return {
    kind: json.kind,
    content_type: json.content_type,
    content: json.content,
    link: json.link,
    alternate: json.alternate ?? {},
  };
}

export type PartialOutput = {
  targets: TARGET[];
  outputs: OutputSummary[];
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
