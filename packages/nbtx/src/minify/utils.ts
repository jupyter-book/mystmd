import type {
  MinifiedErrorOutput,
  MinifiedMimeBundle,
  MinifiedMimePayload,
  MinifiedOutput,
  MinifiedStreamOutput,
} from './types';

export const MAX_CHARS = 25000;
export const TRUNCATED_CHARS_COUNT = 64;

export function isNotNull<T>(arg: T | null): arg is T {
  return arg != null;
}

export function ensureSafePath(path: string): string {
  return path.replace('/', '-');
}

export function walkPaths(
  outputs: MinifiedOutput[],
  func: (p: string, obj: MinifiedStreamOutput | MinifiedErrorOutput | MinifiedMimePayload) => void,
) {
  outputs.forEach((output: MinifiedOutput) => {
    if ('path' in output && output.path) {
      // eslint-disable-next-line no-param-reassign
      func(output.path, output);
    } else if ('data' in output && output.data) {
      const data = output.data as MinifiedMimeBundle;
      const mimetypes = Object.keys(data);
      mimetypes.forEach((mimetype) => {
        const bundle = data[mimetype];
        if ('path' in bundle && bundle.path) {
          func(bundle.path, bundle);
        }
      });
    }
  });
}
