import { validateAuthor } from '../frontmatter/validators';
import {
  defined,
  incrementOptions,
  Options,
  validateDate,
  validateList,
} from '../utils/validators';

/**
 * Validate Export Config
 *
 * This needs to be more complete, or even better, export config should more closely match
 * project/site config and we can reuse those validators...
 */
export function validateExportConfigKeys(value: Record<string, any>, opts: Options) {
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

export function validateJtexFrontmatterKeys(value: Record<string, any>, opts: Options) {
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
