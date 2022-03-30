import { nanoid } from 'nanoid';
import { IOutput, IStream, IError, IDisplayData, IExecuteResult } from '@jupyterlab/nbformat';
import { IFileObjectFactoryFn } from '../files';
import { MinifiedOutput, MinifyOptions } from './types';
import { minifyErrorOutput, minifyStreamOutput } from './text';
import { minifyMimeOutput } from './mime';

function ensureSafePath(path: string): string {
  return path.replace('/', '_');
}

async function minifyOneOutputItem(
  fileFactory: IFileObjectFactoryFn,
  output: IOutput,
  opts: MinifyOptions,
): Promise<MinifiedOutput | null> {
  if (!('output_type' in output)) return null;
  switch (output.output_type) {
    case 'stream':
      return minifyStreamOutput(fileFactory, output as IStream, opts);
    case 'error':
      return minifyErrorOutput(fileFactory, output as IError, opts);
    case 'update_display_data':
    case 'display_data':
    case 'execute_result':
      return minifyMimeOutput(fileFactory, output as IDisplayData | IExecuteResult, opts);
    default:
      return null;
  }
}

function isNotNull<T>(arg: T | null): arg is T {
  return arg != null;
}

export const MAX_CHARS = 25000;
export const TRUNCATED_CHARS_COUNT = 64;

export async function minifyCellOutput(
  fileFactory: IFileObjectFactoryFn,
  outputs: IOutput[],
  opts: MinifyOptions = {
    maxCharacters: MAX_CHARS,
    truncateTo: TRUNCATED_CHARS_COUNT,
    randomPath: false,
  },
): Promise<MinifiedOutput[]> {
  if (!opts.randomPath && !opts.basepath)
    throw Error(`Need to set a basepath or enable randomPath`);
  const minifiedOrNull = await Promise.all(
    outputs.map(async (output, idx) =>
      minifyOneOutputItem(fileFactory, output, {
        ...opts,
        basepath: opts.randomPath ? nanoid() : ensureSafePath(`${opts.basepath}.${idx}`),
      }),
    ),
  );
  return minifiedOrNull.filter(isNotNull);
}
