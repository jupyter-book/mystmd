import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateChoice,
  validateEnum,
  validateList,
  validateNumber,
  validateObjectKeys,
  validateString,
  validationError,
} from 'simple-validators';
import { PAGE_FRONTMATTER_KEYS } from '../page/types.js';
import { PROJECT_FRONTMATTER_KEYS } from '../project/types.js';
import { FRONTMATTER_ALIASES } from '../site/types.js';
import type { Export, ExportArticle } from './types.js';
import { ExportFormats } from './types.js';
import { validateTOC } from 'myst-toc';

const EXPORT_KEY_OBJECT = {
  required: [],
  optional: [
    'format',
    'template',
    'output',
    'zip',
    'id',
    'name',
    'renderer',
    'articles',
    'top_level',
    'sub_articles',
  ],
  alias: {
    article: 'articles',
    sub_article: 'sub_articles',
  },
};

const EXPORT_ARTICLE_KEY_OBJECT = {
  optional: [
    'file',
    'title',
    'level',
    ...PAGE_FRONTMATTER_KEYS,
    ...Object.keys(FRONTMATTER_ALIASES),
  ],
};

export const EXT_TO_FORMAT: Record<string, ExportFormats> = {
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
  '.cff': ExportFormats.cff,
};

export const RESERVED_EXPORT_KEYS = [
  ...EXPORT_KEY_OBJECT.required,
  ...EXPORT_KEY_OBJECT.optional,
  ...Object.keys(EXPORT_KEY_OBJECT.alias),
  ...PROJECT_FRONTMATTER_KEYS,
  ...Object.keys(FRONTMATTER_ALIASES),
];

export const MULTI_ARTICLE_EXPORT_FORMATS = [
  ExportFormats.typst,
  ExportFormats.pdf,
  ExportFormats.tex,
  ExportFormats.pdftex,
];

export function validateExportsList(input: any, opts: ValidationOptions): Export[] | undefined {
  if (input === undefined) return undefined;
  const exportsOptions = { coerce: true, ...incrementOptions('exports', opts) };
  const output = validateList(input, exportsOptions, (exp, ind) => {
    return validateExport(exp, incrementOptions(`exports.${ind}`, opts));
  });
  if (!output || output.length === 0) return undefined;
  const duplicates = new Set<string>();
  output.forEach((exp, ind) => {
    if (
      exp.id &&
      output
        .slice(ind + 1)
        .map(({ id }) => id)
        .includes(exp.id)
    ) {
      duplicates.add(exp.id);
    }
  });
  if (duplicates.size) {
    validationError(`duplicate export ids: ${[...duplicates].join(', ')}`, exportsOptions);
  }
  return output;
}

export function validateExportFormat(
  input: any,
  opts: ValidationOptions,
): ExportFormats | undefined {
  if (input === undefined) return undefined;
  if (input === 'tex+pdf') input = 'pdf+tex';
  if (input === 'jats') input = 'xml';
  const format = validateEnum<ExportFormats>(input, { ...opts, enum: ExportFormats });
  return format;
}

function validateExportArticle(input: any, opts: ValidationOptions): ExportArticle | undefined {
  if (typeof input === 'string') {
    input = { file: input };
  }
  const value = validateObjectKeys(input, EXPORT_ARTICLE_KEY_OBJECT, opts);
  if (!value) return undefined;
  const output: ExportArticle = { ...value };
  if (defined(value.file)) {
    output.file = validateString(value.file, opts);
  }
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.level)) {
    output.level = validateNumber(value.level, {
      min: -1,
      max: 6,
      integer: true,
      ...incrementOptions('level', opts),
    });
  }
  if (!output.title && !output.file) {
    return validationError('export articles must specify file or part/chapter title', opts);
  }
  return output;
}

export function articlesWithFile(articles?: ExportArticle[]) {
  return (
    articles?.filter((article): article is { file: string; level?: number; title?: string } => {
      return !!article.file;
    }) ?? []
  );
}

export function singleArticleWithFile(articles?: ExportArticle[]) {
  return articlesWithFile(articles)[0];
}

export function validateExport(input: any, opts: ValidationOptions): Export | undefined {
  if (typeof input === 'string') {
    // If export is a string it may be (1) format, (2) extension, or (3) output filename
    let format: string | undefined;
    let output: string | undefined;
    if (input.startsWith('.')) {
      Object.entries(EXT_TO_FORMAT).forEach(([ext, fmt]) => {
        if (input === ext) format = fmt; // Input is a known, format-specific extension
      });
    } else if (input.includes('.')) {
      output = input; // Input is filename; format TBD
    }
    if (!format && !output) {
      format = validateExportFormat(input, opts); // Input is valid format
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
    const outputOpts = incrementOptions('output', opts);
    const outputString = validateString(value.output, outputOpts);
    if (outputString) {
      Object.keys(EXT_TO_FORMAT).forEach((ext) => {
        if (outputString.endsWith(ext)) output = outputString;
      });
      // If there is no '.' in the output string (aside from first character) this is assumed to be a folder.
      if (!outputString.slice(1).includes('.')) {
        output = outputString;
      }
      if (!output) {
        return validationError(`unknown export output extension: ${outputString}`, outputOpts);
      }
    }
  }
  if (defined(value.format)) {
    format = validateExportFormat(value.format, incrementOptions('format', opts));
    // If format is defined but invalid, validation fails
    if (!format) return undefined;
  }
  if (!format && !template && !output) {
    return validationError('export must specify one of: format, template, or output', opts);
  }
  const validExport: Export = { ...value, format, output, template };
  if (defined(value.id)) {
    validExport.id = validateString(value.id, incrementOptions('id', opts));
  }
  if (defined(value.zip)) {
    validExport.zip = validateBoolean(value.zip, incrementOptions('zip', opts));
  }
  if (defined(value.articles)) {
    const articles = validateList(
      value.articles,
      { coerce: true, ...incrementOptions('articles', opts) },
      (item, ind) => validateExportArticle(item, incrementOptions(`articles.${ind}`, opts)),
    );
    const singleArticle = singleArticleWithFile(articles);
    if (articles?.length) {
      if (!singleArticle) {
        validationError('no files found in export article list', opts);
        validExport.articles = undefined;
      } else if (
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
        validExport.articles = [singleArticle];
      } else {
        validExport.articles = articles;
      }
    } else {
      validExport.articles = undefined;
    }
  }
  if (defined(value.top_level)) {
    validExport.top_level = validateChoice(value.top_level || 'sections', {
      ...incrementOptions('top_level', opts),
      choices: ['parts', 'chapters', 'sections'],
    }) as Export['top_level'];
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
  if (defined(value.toc)) {
    const tocOpts = incrementOptions('toc', opts);
    if (validExport.articles || validExport.sub_articles) {
      validationError(
        'export cannot define both toc and articles/sub_articles; ignoring toc',
        tocOpts,
      );
      validExport.toc = undefined;
    } else if (typeof value.toc === 'string') {
      // Support legacy behavior of providing a jupyterbook toc file as export.toc
      validExport.tocFile = value.toc;
      validExport.toc = undefined;
    } else {
      validExport.toc = validateTOC(value.toc, tocOpts);
    }
  }
  return validExport;
}
