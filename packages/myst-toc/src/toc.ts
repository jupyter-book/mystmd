import type { TOC } from './types.js';
import schema from './schema.json';
import _Ajv from 'ajv';

// Adjust types for ES module
// @ts-ignore
const Ajv = _Ajv as unknown as typeof _Ajv.default;

/**
 * Parse a sphinx-external-toc table of contents
 *
 * @param contents: raw TOC yaml
 */
export function parseTOC(toc: Record<string, unknown>): TOC {
  const ajv = new Ajv.default();
  const validate = ajv.compile(schema);
  if (!validate(toc)) {
    throw new Error(
      `The given contents do not form a valid TOC.`,
    );
  }

  return toc as unknown as TOC;
}

