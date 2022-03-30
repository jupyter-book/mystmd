import {
  CellOutput,
  KnownCellOutputMimeTypes,
  CellOutputType,
  JsonObject,
} from '@curvenote/blocks';
import { IDisplayData, IError, IExecuteResult, IStream } from '@jupyterlab/nbformat';
import { IFileObject, Metadata } from '../src/files';

export function makeCellOutput(
  output_type?: CellOutputType,
  mimetype?: KnownCellOutputMimeTypes,
  content?: JsonObject | string[] | string,
) {
  return {
    output_type: output_type ?? CellOutputType.DisplayData,
    data: {
      [mimetype ?? KnownCellOutputMimeTypes.TextPlain]: content ?? 'hello world',
    },
    metadata: {},
  } as CellOutput;
}

export function makeNativeStreamOutput(text?: string | string[]) {
  return {
    output_type: 'stream',
    name: 'stdout',
    text: text ?? 'hello world',
    metadata: { meta: 'data' },
  } as IStream;
}

export function makeNativeErrorOutput(traceback?: string[]) {
  return {
    output_type: 'error',
    ename: 'error-name',
    evalue: 'error-value',
    traceback: traceback ?? ['hello', 'world'],
    metadata: { meta: 'data' },
  } as IError;
}

export function makeNativeMimeOutput(output_type?: string, mimetype?: string, content?: any) {
  return {
    output_type: output_type ?? 'execute_result',
    data: {
      [mimetype ?? 'text/plain']: content ?? 'hello world',
    },
    metadata: { meta: 'data' },
  } as IExecuteResult | IDisplayData;
}

const fileBackend: {
  lastWrite: 'writeString' | 'writeBase64' | null;
} = {
  lastWrite: null,
};

export type IFileObjectFactoryFn = (path: string) => IFileObject;

export const getLastFileWrite = () => fileBackend.lastWrite;

export class TestFileObject implements IFileObject {
  path: string;

  constructor(path: string) {
    this.path = path;
  }

  get id() {
    return this.path;
  }

  writeString(data: string, contentType: string): Promise<void> {
    fileBackend.lastWrite = 'writeString';
    return Promise.resolve();
  }

  writeBase64(data: string, contentType: string): Promise<void> {
    fileBackend.lastWrite = 'writeBase64';
    return Promise.resolve();
  }

  setContentType(contentType: string): Promise<Metadata> {
    return Promise.resolve({} as Metadata);
  }

  async url() {
    return 'stub-file-signature';
  }

  async exists() {
    return true;
  }
}
