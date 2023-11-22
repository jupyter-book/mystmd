import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateEnum,
  validateList,
  validateObjectKeys,
  validateString,
  validationError,
} from 'simple-validators';
import type { Export } from './types.js';
import { ExportFormats } from './types.js';

const EXPORT_KEY_OBJECT = {
  required: ['format'],
  optional: ['template', 'output', 'id', 'name', 'renderer', 'articles', 'sub_articles'],
  alias: {
    article: 'articles',
    sub_article: 'sub_articles',
  },
};

export const RESERVED_EXPORT_KEYS = [
  ...EXPORT_KEY_OBJECT.required,
  ...EXPORT_KEY_OBJECT.optional,
  ...Object.keys(EXPORT_KEY_OBJECT.alias),
];

export function validateExportsList(input: any, opts: ValidationOptions): Export[] | undefined {
  if (input === undefined) return undefined;
  const output = validateList(
    input,
    { coerce: true, ...incrementOptions('exports', opts) },
    (exp, ind) => {
      return validateExport(exp, incrementOptions(`exports.${ind}`, opts));
    },
  );
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
  if (typeof input === 'string') {
    const format = validateExportFormat(input, opts);
    if (!format) return undefined;
    input = { format };
  }
  const value = validateObjectKeys(input, EXPORT_KEY_OBJECT, {
    ...opts,
    suppressWarnings: true,
    keepExtraKeys: true,
  });
  if (value === undefined) return undefined;
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
  if (defined(value.articles)) {
    const articles = validateList(
      value.articles,
      { coerce: true, ...incrementOptions('articles', opts) },
      (item, ind) => validateString(item, incrementOptions(`articles.${ind}`, opts)),
    );
    if (
      articles?.length &&
      articles.length > 1 &&
      ![ExportFormats.pdf, ExportFormats.tex, ExportFormats.pdftex].includes(output.format)
    ) {
      if (output.format === ExportFormats.xml && !defined(value.sub_articles)) {
        validationError(
          "multiple articles are not supported for 'jats' export - instead specify one article with additional sub_articles",
          opts,
        );
      } else {
        validationError("multiple articles are only supported for 'tex' and 'pdf' exports", opts);
      }
      output.articles = [articles[0]];
    } else {
      output.articles = articles;
    }
  }
  if (defined(value.sub_articles)) {
    if (output.format !== ExportFormats.xml) {
      validationError("sub_articles are only supported for 'jats' export", opts);
      output.sub_articles = undefined;
    } else {
      output.sub_articles = validateList(
        value.sub_articles,
        { coerce: true, ...incrementOptions('sub_articles', opts) },
        (file, ind) => {
          return validateString(file, incrementOptions(`sub_articles.${ind}`, opts));
        },
      );
    }
  }
  return output;
}
