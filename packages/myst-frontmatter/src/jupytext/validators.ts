import type { ValidationOptions } from 'simple-validators';
import { defined, incrementOptions, validateObjectKeys, validateString } from 'simple-validators';
import type { Jupytext, TextRepresentation } from './types.js';

const TEXT_REPRESENTATION_KEYS = ['extension', 'format_name', 'format_version', 'jupytext_version'];
const JUPYTEXT_KEYS = ['formats', 'text_representation'];

function validateTextRepresentation(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: TEXT_REPRESENTATION_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: TextRepresentation = {};
  if (defined(value.extension)) {
    output.extension = validateString(value.extension, incrementOptions('extension', opts));
  }
  if (defined(value.format_name)) {
    output.format_name = validateString(value.format_name, incrementOptions('format_name', opts));
  }
  if (defined(value.format_version)) {
    // The format version occasionally comes as a number in YAML, treat it as a string
    const format_version =
      typeof value.format_version === 'number'
        ? String(value.format_version)
        : value.format_version;
    output.format_version = validateString(
      format_version,
      incrementOptions('format_version', opts),
    );
  }
  if (defined(value.jupytext_version)) {
    output.jupytext_version = validateString(
      value.jupytext_version,
      incrementOptions('jupytext_version', opts),
    );
  }
  return output;
}

/**
 * Validate Jupytext object
 *
 * https://jupyterbook.org/en/stable/file-types/myst-notebooks.html
 */
export function validateJupytext(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: JUPYTEXT_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Jupytext = {};
  if (defined(value.formats)) {
    output.formats = validateString(value.formats, incrementOptions('formats', opts));
  }
  if (defined(value.text_representation)) {
    output.text_representation = validateTextRepresentation(
      value.text_representation,
      incrementOptions('text_representation', opts),
    );
  }
  return output;
}
