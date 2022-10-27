import {
  MinifiedErrorOutput,
  MinifiedMimePayload,
  MinifiedOutput,
  MinifiedStreamOutput,
} from './types';
import { walkPaths } from './utils';

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
  walkPaths(
    outputs,
    (p: string, obj: MinifiedStreamOutput | MinifiedErrorOutput | MinifiedMimePayload) => {
      // eslint-disable-next-line no-param-reassign
      obj.path = formatFn(p);
      return p;
    },
  );
}
