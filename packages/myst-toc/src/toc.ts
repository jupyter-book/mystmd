import type { TOC, Entry, FileEntry, URLEntry, PatternEntry, ParentEntry } from './types.js';

import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateEnum,
  validateList,
  validateNumber,
  validateObjectKeys,
  validateString,
  validationError,
} from 'simple-validators';

const COMMON_ENTRY_KEYS = ['title', 'hidden', 'numbering', 'id', 'part', 'class'];

function validateCommonEntry(entry: any, opts: ValidationOptions): Entry | undefined {
  if (defined(entry.title)) {
    entry.title = validateString(entry.title, incrementOptions('title', opts));
  }

  if (defined(entry.hidden)) {
    entry.hidden = validateBoolean(entry.hidden, incrementOptions('hidden', opts));
  }

  if (defined(entry.numbering)) {
    entry.numbering = validateString(entry.numbering, incrementOptions('numbering', opts));
  }

  if (defined(entry.id)) {
    entry.id = validateString(entry.id, incrementOptions('id', opts));
  }

  if (defined(entry.part)) {
    entry.part = validateString(entry.part, incrementOptions('part', opts));
  }

  if (defined(entry.class)) {
    entry.class = validateString(entry.class, incrementOptions('class', opts));
  }

  return entry as Entry;
}

export function validateFileEntry(entry: any, opts: ValidationOptions): FileEntry | undefined {
  let outputEntry = validateObjectKeys(
    entry,
    {
      required: ['file'],
      optional: [...COMMON_ENTRY_KEYS, 'children'],
    },
    opts,
  );
  if (!outputEntry) {
    return undefined;
  }

  outputEntry.file = validateString(outputEntry.file, incrementOptions('file', opts));

  outputEntry = validateCommonEntry(outputEntry, opts);
  if (!outputEntry) {
    return undefined;
  }

  if (defined(entry.children)) {
    outputEntry.children = validateList(
      outputEntry.children,
      incrementOptions('children', opts),
      (item, ind) => validateEntry(item, incrementOptions(`children.${ind}`, opts)),
    );
  }

  return outputEntry as FileEntry;
}

export function validateURLEntry(entry: any, opts: ValidationOptions): URLEntry | undefined {
  let outputEntry = validateObjectKeys(
    entry,
    {
      required: ['url'],
      optional: [...COMMON_ENTRY_KEYS, 'children'],
    },
    opts,
  );
  if (!outputEntry) {
    return undefined;
  }

  outputEntry.url = validateString(outputEntry.url, incrementOptions('url', opts));

  outputEntry = validateCommonEntry(outputEntry, opts);
  if (!outputEntry) {
    return undefined;
  }

  if (defined(entry.children)) {
    outputEntry.children = validateList(
      outputEntry.children,
      incrementOptions('children', opts),
      (item, ind) => validateEntry(item, incrementOptions(`children.${ind}`, opts)),
    );
  }

  return outputEntry as URLEntry;
}

export function validatePatternEntry(
  entry: any,
  opts: ValidationOptions,
): PatternEntry | undefined {
  let outputEntry = validateObjectKeys(
    entry,
    {
      required: ['pattern'],
      optional: [...COMMON_ENTRY_KEYS, 'children'],
    },
    opts,
  );
  if (!outputEntry) {
    return undefined;
  }

  outputEntry.pattern = validateString(outputEntry.pattern, incrementOptions('pattern', opts));

  outputEntry = validateCommonEntry(outputEntry, opts);
  if (!outputEntry) {
    return undefined;
  }

  if (defined(entry.children)) {
    outputEntry.children = validateList(
      outputEntry.children,
      incrementOptions('children', opts),
      (item, ind) => validateEntry(item, incrementOptions(`children.${ind}`, opts)),
    );
  }

  return outputEntry as PatternEntry;
}

export function validateParentEntry(entry: any, opts: ValidationOptions): ParentEntry | undefined {
  let outputEntry = validateObjectKeys(
    entry,
    {
      required: ['title', 'children'],
      optional: [...COMMON_ENTRY_KEYS],
    },
    opts,
  );
  if (!outputEntry) {
    return undefined;
  }

  outputEntry.title = validateString(outputEntry.title, incrementOptions('title', opts));
  outputEntry.children = validateList(
    outputEntry.children,
    incrementOptions('children', opts),
    (item, ind) => validateEntry(item, incrementOptions(`children.${ind}`, opts)),
  );

  outputEntry = validateCommonEntry(outputEntry, opts);
  if (!outputEntry) {
    return undefined;
  }

  return outputEntry as ParentEntry;
}

export function validateEntry(entry: any, opts: ValidationOptions): Entry | undefined {
  if (defined(entry.file)) {
    return validateFileEntry(entry, opts);
  } else if (defined(entry.url)) {
    return validateURLEntry(entry, opts);
  } else if (defined(entry.pattern)) {
    return validatePatternEntry(entry, opts);
  } else if (defined(entry.title)) {
    return validateParentEntry(entry, opts);
  } else {
    return validationError("expected an entry with 'file', 'url', 'pattern', or 'title'", opts);
  }
}

/**
 * validate a MyST table of contents
 *
 * @param toc: structured TOC data
 */
export function validateTOC(toc: any, opts: ValidationOptions): TOC | undefined {
  return validateList(toc, opts, (item, ind) =>
    validateEntry(item, incrementOptions(`${ind}`, opts)),
  ) as unknown as TOC | undefined;
}
