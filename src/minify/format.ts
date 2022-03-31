import { MinifiedMimeBundle, MinifiedOutput } from './types';

/**
 * formatMinifiedPaths
 *
 * Find all the paths in the minified outputs and format them using teh format function.
 * Useful for pre-pending paths etc.
 *
 * Warning: function with side effects - objects are mutated in place
 *
 * @param outputs
 */
export function formatMinifiedPaths(outputs: MinifiedOutput[], formatFn: (p: string) => string) {
  outputs.forEach((output: MinifiedOutput) => {
    if ('path' in output && output.path) {
      // eslint-disable-next-line no-param-reassign
      output.path = formatFn(output.path);
    } else if ('data' in output && output.data) {
      const data = output.data as MinifiedMimeBundle;
      const mimetypes = Object.keys(data);
      mimetypes.forEach((mimetype) => {
        const bundle = data[mimetype];
        if ('path' in bundle && bundle.path) {
          bundle.path = formatFn(bundle.path);
        }
      });
    }
  });
}
