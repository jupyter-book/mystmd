import type { TOC } from './types.js';
import schema from './schema.json';
import _Ajv from 'ajv';

/**
 * Parse a sphinx-external-toc table of contents
 *
 * @param contents: raw TOC yaml
 */
export function parseTOC(toc: Record<string, unknown>): TOC {
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
