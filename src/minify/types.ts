import { IStream, IError, ExecutionCount, OutputMetadata } from '@jupyterlab/nbformat';

export interface MinifyOptions {
  basepath: string;
  maxCharacters: number;
  truncateTo: number;
}

export type MinifiedStreamOutput = { path?: string } & IStream;
export type MinifiedErrorOutput = { path?: string } & IError;

export type MimeOutputType = 'execute_result' | 'display_data' | 'update_display_data';

export interface MinifiedMimePayload {
  content_type: string;
  content: string;
  path?: string;
}

export interface MinifiedMimeBundle {
  [content_type: string]: MinifiedMimePayload;
}

export interface MinifiedMimeOutput {
  output_type: MimeOutputType;
  execution_count?: ExecutionCount;
  metadata: OutputMetadata;
  data: MinifiedMimeBundle;
}

export type MinifiedOutput = MinifiedStreamOutput | MinifiedErrorOutput | MinifiedMimeOutput;
