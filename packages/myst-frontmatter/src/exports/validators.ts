import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateEnum,
  validateKeys,
  validateList,
  validateObject,
  validateString,
  validationError,
} from 'simple-validators';
import type { Export } from './types.js';
import { ExportFormats } from './types.js';

export const RESERVED_EXPORT_KEYS = [
  'format',
  'template',
  'output',
  'id',
  'name',
  'renderer',
  'article',
  'sub_articles',
];

export function validateExportsList(input: any, opts: ValidationOptions): Export[] | undefined {
  // Allow a single export to be defined as a dict
  if (input === undefined) return undefined;
  let exports: any[];
  if (Array.isArray(input)) {
    exports = input;
  } else {
    exports = [input];
  }
  const output = validateList(exports, incrementOptions('exports', opts), (exp, ind) => {
    return validateExport(exp, incrementOptions(`exports.${ind}`, opts));
  });
  if (!output || output.length === 0) return undefined;
  return output;
}

function validateExportFormat(input: any, opts: ValidationOptions): ExportFormats | undefined {
  if (input === undefined) return undefined;
  if (input === 'tex+pdf') input = 'pdf+tex';
  if (input === 'jats') input = 'xml';
  const format = validateEnum<ExportFormats>(input, { ...opts, enum: ExportFormats });
  return format;
}

export function validateExport(input: any, opts: ValidationOptions): Export | undefined {
  let value;
  if (typeof input === 'string') {
    const format = validateExportFormat(input, opts);
    if (!format) return undefined;
    value = { format };
  } else {
    value = validateObject(input, opts);
  }
  if (value === undefined) return undefined;
  validateKeys(
    value,
    { required: ['format'], optional: RESERVED_EXPORT_KEYS },
    { ...opts, suppressWarnings: true },
  );
  const format = validateExportFormat(value.format, incrementOptions('format', opts));
  if (format === undefined) return undefined;
  const output: Export = { ...value, format };
  if (value.template === null) {
    // It is possible for the template to explicitly be null.
    // This use no template (rather than default template).
    output.template = null;
  } else if (defined(value.template)) {
    output.template = validateString(value.template, incrementOptions('template', opts));
  }
  if (defined(value.output)) {
    output.output = validateString(value.output, incrementOptions('output', opts));
  }
  if (defined(value.article)) {
    output.article = validateString(value.article, incrementOptions('article', opts));
  }
  if (defined(value.sub_articles)) {
    if (output.format !== ExportFormats.xml) {
      validationError("sub_articles are only supported for exports of format 'jats'", opts);
    } else {
      output.sub_articles = validateList(
        value.sub_articles,
        incrementOptions('sub_articles', opts),
        (file, ind) => {
          return validateString(file, incrementOptions(`sub_articles.${ind}`, opts));
        },
      );
    }
  }
  return output;
}
