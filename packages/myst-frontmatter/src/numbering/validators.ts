import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateNumber,
  validateObjectKeys,
  validateString,
} from 'simple-validators';
import type { Numbering } from './types.js';

export const NUMBERING_OPTIONS = ['enumerator', 'headings'];

const HEADING_KEYS = ['heading_1', 'heading_2', 'heading_3', 'heading_4', 'heading_5', 'heading_6'];
export const NUMBERING_KEYS = ['figure', 'equation', 'table', 'code', ...HEADING_KEYS];

export const NUMBERING_ALIAS = {
  sections: 'headings',
  h1: 'heading_1',
  h2: 'heading_2',
  h3: 'heading_3',
  h4: 'heading_4',
  h5: 'heading_5',
  h6: 'heading_6',
  heading1: 'heading_1',
  heading2: 'heading_2',
  heading3: 'heading_3',
  heading4: 'heading_4',
  heading5: 'heading_5',
  heading6: 'heading_6',
};

/**
 * Validate Numbering object
 */
export function validateNumbering(input: any, opts: ValidationOptions): Numbering | undefined {
  const value = validateObjectKeys(
    input,
    { optional: [...NUMBERING_KEYS, ...NUMBERING_OPTIONS], alias: NUMBERING_ALIAS },
    { ...opts, suppressWarnings: true, keepExtraKeys: true },
  );
  if (value === undefined) return undefined;
  const output: Record<string, any> = {};
  if (defined(value.enumerator)) {
    output.enumerator = validateString(value.enumerator, incrementOptions('enumerator', opts));
  }
  if (defined(value.headings)) {
    const headings = validateBoolean(value.headings, incrementOptions('headings', opts));
    HEADING_KEYS.forEach((headingKey) => {
      if (headings && !defined(value[headingKey])) {
        // This will be validated next!
        value[headingKey] = true;
      }
    });
  }
  Object.keys(value)
    .filter((key) => !NUMBERING_OPTIONS.includes(key)) // For all the unknown options
    .forEach((key) => {
      if (defined(value[key])) {
        if (typeof value[key] === 'number') {
          const number = validateNumber(value[key], {
            ...incrementOptions(key, opts),
            integer: true,
            min: 1,
          });
          if (defined(number)) output[key] = number;
        } else {
          const bool = validateBoolean(value[key], incrementOptions(key, opts));
          if (defined(bool)) output[key] = bool;
        }
      }
    });
  if (Object.keys(output).length === 0) return undefined;
  return output;
}
