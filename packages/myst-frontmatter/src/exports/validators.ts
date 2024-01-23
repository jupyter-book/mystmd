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
  required: [],
  optional: ['format', 'template', 'output', 'id', 'name', 'renderer', 'articles', 'sub_articles'],
  alias: {
    article: 'articles',
    sub_article: 'sub_articles',
  },
};

const EXT_TO_FORMAT = {
  '.pdf': ExportFormats.pdf,
  '.tex': ExportFormats.tex,
  '.doc': ExportFormats.docx,
  '.docx': ExportFormats.docx,
  '.md': ExportFormats.md,
  '.zip': ExportFormats.meca,
  '.meca': ExportFormats.meca,
  '.xml': ExportFormats.xml,
  '.jats': ExportFormats.xml,
  '.typ': ExportFormats.typst,
  '.typst': ExportFormats.typst,
};

export const RESERVED_EXPORT_KEYS = [
  ...EXPORT_KEY_OBJECT.required,
  ...EXPORT_KEY_OBJECT.optional,
  ...Object.keys(EXPORT_KEY_OBJECT.alias),
];

export const MULTI_ARTICLE_EXPORT_FORMATS = [
  ExportFormats.pdf,
  ExportFormats.tex,
  ExportFormats.typst,
  ExportFormats.pdftex,
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
    let format: string | undefined;
    let output: string | undefined;
    if (input.includes('.')) {
      Object.entries(EXT_TO_FORMAT).forEach(([ext, fmt]) => {
        if (input === ext) {
          format = fmt;
        } else if (input.endsWith(ext)) {
          output = input;
        }
      });
      if (!format && !output) {
        output = input;
      }
    }
    if (!format && !output) {
      format = validateExportFormat(input, opts);
      if (!format) return undefined;
    }
    input = { format, output };
  }
  const value = validateObjectKeys(input, EXPORT_KEY_OBJECT, {
    ...opts,
    suppressWarnings: true,
    keepExtraKeys: true,
  });
  if (value === undefined) return undefined;
  let format: ExportFormats | undefined;
  let output: string | undefined;
  let template: string | null | undefined;
  if (value.template === null) {
    // It is possible for the template to explicitly be null.
    // This use no template (rather than default template).
    template = null;
  } else if (defined(value.template)) {
    template = validateString(value.template, incrementOptions('template', opts));
  }
  if (defined(value.output)) {
    output = validateString(value.output, incrementOptions('output', opts));
  }
  if (defined(value.format)) {
    format = validateExportFormat(value.format, incrementOptions('format', opts));
    // If format is defined but invalid, validation fails
    if (!format) return undefined;
  } else if (output) {
    // If output is defined, format is inferred from output
    Object.entries(EXT_TO_FORMAT).forEach(([ext, fmt]) => {
      if (output?.endsWith(ext)) format = fmt;
    });
    if (!format) {
      return validationError(`unable to infer export format from export: ${output}`, opts);
    }
  } else {
    // if (!template) {
    // TODO: If template is defined, that will tell us the format later!
    return validationError('unable to determine export format', opts);
  }
  if (format === undefined && template === undefined) return undefined;
  const validExport: Export = { ...value, format, output, template };
  if (defined(value.articles)) {
    const articles = validateList(
      value.articles,
      { coerce: true, ...incrementOptions('articles', opts) },
      (item, ind) => validateString(item, incrementOptions(`articles.${ind}`, opts)),
    );
    if (
      articles?.length &&
      articles.length > 1 &&
      validExport.format &&
      !MULTI_ARTICLE_EXPORT_FORMATS.includes(validExport.format)
    ) {
      if (validExport.format === ExportFormats.xml && !defined(value.sub_articles)) {
        validationError(
          "multiple articles are not supported for 'jats' export - instead specify one article with additional sub_articles",
          opts,
        );
      } else {
        validationError(
          "multiple articles are only supported for 'tex', 'typst', and 'pdf' exports",
          opts,
        );
      }
      validExport.articles = [articles[0]];
    } else {
      validExport.articles = articles;
    }
  }
  if (defined(value.sub_articles)) {
    if (validExport.format !== ExportFormats.xml) {
      validationError("sub_articles are only supported for 'jats' export", opts);
      validExport.sub_articles = undefined;
    } else {
      validExport.sub_articles = validateList(
        value.sub_articles,
        { coerce: true, ...incrementOptions('sub_articles', opts) },
        (file, ind) => {
          return validateString(file, incrementOptions(`sub_articles.${ind}`, opts));
        },
      );
    }
  }
  return validExport;
}
