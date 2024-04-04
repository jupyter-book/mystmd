import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateList,
  validateObjectKeys,
  validateString,
  validationError,
} from 'simple-validators';
import { validateExportFormat } from '../exports/validators.js';
import type { Download } from './types.js';

const DOWNLOAD_KEY_OBJECT = {
  required: [],
  optional: ['title', 'url', 'id', 'filename', 'format', 'internal', 'static'],
  alias: {
    ref: 'id',
    file: 'url',
  },
};

export function validateDownload(input: any, opts: ValidationOptions): Download | undefined {
  if (typeof input === 'string') {
    input = { url: input };
  }
  const value = validateObjectKeys(input, DOWNLOAD_KEY_OBJECT, opts);
  if (value === undefined) return undefined;
  const output: Download = {};
  if (defined(value.id)) {
    output.id = validateString(value.id, incrementOptions('id', opts));
  }
  if (defined(value.url)) {
    output.url = validateString(value.url, incrementOptions('url', opts));
  }
  if (output.url && output.id) {
    return validationError(`download must define only one of id and file/url, not both`, opts);
  }
  if (!output.url && !output.id) {
    return validationError(`download must define either id or file/url`, opts);
  }
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.filename)) {
    output.filename = validateString(value.filename, incrementOptions('filename', opts));
  }
  if (defined(value.format)) {
    output.format = validateExportFormat(value.format, incrementOptions('format', opts));
  }
  if (defined(value.internal)) {
    output.internal = validateBoolean(value.internal, incrementOptions('internal', opts));
  }
  if (defined(value.static)) {
    output.static = validateBoolean(value.static, incrementOptions('static', opts));
  }
  return output;
}

export function validateDownloadsList(input: any, opts: ValidationOptions): Download[] | undefined {
  if (input === undefined) return undefined;
  const output = validateList(
    input,
    { coerce: true, ...incrementOptions('downloads', opts) },
    (exp, ind) => {
      return validateDownload(exp, incrementOptions(`downloads.${ind}`, opts));
    },
  );
  if (!output || output.length === 0) return undefined;
  return output;
}
