import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validateBoolean,
} from 'simple-validators';
import { validateProjectAndPageFrontmatterKeys } from '../project/validators.js';
import { PAGE_FRONTMATTER_KEYS, type PageFrontmatter } from './types.js';
import { validateKernelSpec } from '../kernelspec/validators.js';
import { validateJupytext } from '../jupytext/validators.js';
import { FRONTMATTER_ALIASES } from '../site/types.js';

export const USE_PROJECT_FALLBACK = [
  'authors',
  'reviewers',
  'editors',
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
  'copyright',
  'affiliations',
];

export function validatePageFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: PageFrontmatter = validateProjectAndPageFrontmatterKeys(value, opts);
  if (defined(value.label)) {
    output.label = validateString(value.label, incrementOptions('label', opts));
  }
  if (defined(value.kernelspec)) {
    output.kernelspec = validateKernelSpec(value.kernelspec, incrementOptions('kernelspec', opts));
  }
  if (defined(value.jupytext)) {
    output.jupytext = validateJupytext(value.jupytext, incrementOptions('jupytext', opts));
  }
  if (defined(value.content_includes_title)) {
    output.content_includes_title = validateBoolean(
      value.content_includes_title,
      incrementOptions('content_includes_title', opts),
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
      { optional: PAGE_FRONTMATTER_KEYS, alias: { ...FRONTMATTER_ALIASES, name: 'label' } },
      opts,
    ) || {};
  return validatePageFrontmatterKeys(value, opts);
}
