import { validateAuthor } from 'myst-frontmatter';
import type { ValidationOptions } from '@curvenote/validators';
import { defined, incrementOptions, validateDate, validateList } from '@curvenote/validators';

/**
 * Validate Export Config
 *
 * TODO: This needs to be more complete, or even better, export config should more closely match
 * project/site config and we can reuse those validators...
 */
export function validateExportConfigKeys(value: Record<string, any>, opts: ValidationOptions) {
  if (defined(value.data?.authors)) {
    value.data.authors = validateList(
      value.data.authors,
      incrementOptions('authors', opts),
      (author, index) => {
        return validateAuthor(author, incrementOptions(`authors.${index}`, opts));
      },
    );
  }
  return value;
}

/**
 * Perform validation/corsion on jtex output
 *
 * TODO: these coersions could remain in memory and be passed directly to jtex, instead of written to file
 */
export function validateJtexFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  let date: Date;
  if (defined(value.date)) {
    const validDate = validateDate(value.date, incrementOptions('date', opts));
    date = validDate ? new Date(validDate) : new Date();
  } else {
    date = new Date();
  }
  value.date = {
    year: date.getFullYear(),
    month: date.getMonth() + 1, // latex expects 1-indexed month
    day: date.getDate(),
  };
  // TODO: Do we need to resurrect is_corresponding? single affiliation? location? curvenote?
  return value;
}
