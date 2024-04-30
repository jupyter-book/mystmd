import type { TOC } from './types.js';
import schema from './schema.json';
import _Ajv from 'ajv';

/**
 * validate a MyST table of contents
 *
 * @param toc: structured TOC data
 */
export function validateTOC(toc: Record<string, unknown>): TOC {
  // eslint-disable-next-line
  // @ts-ignore
  const Ajv = _Ajv.default;
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  if (!validate(toc)) {
    throw new Error(`The given contents do not form a valid TOC.`);
  }

  return toc as unknown as TOC;
}
