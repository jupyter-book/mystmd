import * as plugins from './plugins';

export * from './mdast';
export * from './myst';
export { plugins };

import { remove } from 'unist-util-remove';
import { select, selectAll } from 'unist-util-select';

export {
  /** @deprecated
   *
   * Please use:
   * ```ts
   * import { remove } from 'unist-util-remove';
   * ```
   */
  remove,
  /** @deprecated
   *
   * Please use:
   * ```ts
   * import { select } from 'unist-util-select';
   * ```
   */
  select,
  /** @deprecated
   *
   * Please use:
   * ```ts
   * import { selectAll } from 'unist-util-select';
   * ```
   */
  selectAll,
};
