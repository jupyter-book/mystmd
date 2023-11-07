import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
} from 'simple-validators';
import {
  PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  validateProjectAndPageFrontmatterKeys,
} from '../project/validators.js';
import type { Jupytext, KernelSpec, PageFrontmatter, TextRepresentation } from './types.js';
import { FRONTMATTER_ALIASES } from '../index.js';

export const PAGE_FRONTMATTER_KEYS = [
  ...PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  // These keys only exist on the page
  'kernelspec',
  'jupytext',
  'tags',
];

export const USE_PROJECT_FALLBACK = [
  'authors',
  'date',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'github',
  'binder',
  'source',
  'subject',
  'venue',
  'biblio',
  'numbering',
  'keywords',
  'funding',
  'affiliations',
];

const KERNELSPEC_KEYS = ['name', 'language', 'display_name', 'argv', 'env'];
const TEXT_REPRESENTATION_KEYS = ['extension', 'format_name', 'format_version', 'jupytext_version'];
const JUPYTEXT_KEYS = ['formats', 'text_representation'];

/**
 * Validate KernelSpec object
 */
export function validateKernelSpec(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: KERNELSPEC_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: KernelSpec = {};
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.language)) {
    output.language = validateString(value.language, incrementOptions('language', opts));
  }
  if (defined(value.display_name)) {
    output.display_name = validateString(
      value.display_name,
      incrementOptions('display_name', opts),
    );
  }
  if (defined(value.env)) {
    output.env = validateObject(value.env, incrementOptions('env', opts));
  }
  if (defined(value.argv)) {
    output.argv = validateList(value.argv, incrementOptions('argv', opts), (arg, index) => {
      return validateString(arg, incrementOptions(`argv.${index}`, opts));
    });
  }
  return output;
}

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

export function validatePageFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: PageFrontmatter = validateProjectAndPageFrontmatterKeys(value, opts);
  if (defined(value.kernelspec)) {
    output.kernelspec = validateKernelSpec(value.kernelspec, incrementOptions('kernelspec', opts));
  }
  if (defined(value.jupytext)) {
    output.jupytext = validateJupytext(value.jupytext, incrementOptions('jupytext', opts));
  }
  if (defined(value.tags)) {
    output.tags = validateList(
      value.tags,
      incrementOptions('tags', opts),
      (file, index: number) => {
        return validateString(file, incrementOptions(`tags.${index}`, opts));
      },
    );
  }
  return output;
}

/**
 * Validate single PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PAGE_FRONTMATTER_KEYS, alias: FRONTMATTER_ALIASES },
      opts,
    ) || {};
  return validatePageFrontmatterKeys(value, opts);
}
