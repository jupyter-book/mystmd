import type { IOutput, IStream, IError, IDisplayData, IExecuteResult } from '@jupyterlab/nbformat';
import type { IFileObjectFactoryFn } from '../files';
import type { MinifiedOutput, MinifyOptions } from './types';
import { minifyErrorOutput, minifyStreamOutput } from './text';
import { minifyMimeOutput } from './mime';
import { ensureSafePath, isNotNull, MAX_CHARS, TRUNCATED_CHARS_COUNT } from './utils';

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

export async function minifyCellOutput(
  fileFactory: IFileObjectFactoryFn,
  outputs: IOutput[],
  opts: Partial<MinifyOptions> = {},
): Promise<MinifiedOutput[]> {
  const options = {
    basepath: opts.basepath ?? 'output',
    maxCharacters: opts.maxCharacters ?? MAX_CHARS,
    truncateTo: opts.truncateTo ?? TRUNCATED_CHARS_COUNT,
  };
  const minifiedOrNull = await Promise.all(
    outputs.map(async (output, idx) =>
      minifyOneOutputItem(fileFactory, output, {
        ...options,
        basepath: ensureSafePath(`${options.basepath}.${idx}`),
      }),
    ),
  );
  return minifiedOrNull.filter(isNotNull);
}
