import type {
  TOC,
  Entry,
  FileEntry,
  FileParentEntry,
  URLEntry,
  URLParentEntry,
  PatternEntry,
  ParentEntry,
  CommonEntry,
} from './types.js';

import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateList,
  validateObjectKeys,
  validateObject,
  validateString,
  validationError,
  validateBoolean,
} from 'simple-validators';

const COMMON_ENTRY_KEYS = ['title', 'hidden'];
// const COMMON_ENTRY_KEYS = ['title', 'hidden', 'numbering', 'id', 'class'];

function validateCommonEntry(entry: Record<string, any>, opts: ValidationOptions): CommonEntry {
  const output: CommonEntry = {};
  if (defined(entry.title)) {
    output.title = validateString(entry.title, incrementOptions('title', opts));
  }

  if (defined(entry.hidden)) {
    output.hidden = validateBoolean(entry.hidden, incrementOptions('hidden', opts));
  }

  // if (defined(entry.numbering)) {
  //   output.numbering = validateString(entry.numbering, incrementOptions('numbering', opts));
  // }

  // if (defined(entry.id)) {
  //   output.id = validateString(entry.id, incrementOptions('id', opts));
  // }

  // if (defined(entry.class)) {
  //   output.class = validateString(entry.class, incrementOptions('class', opts));
  // }

  return output;
}

export function validateFileEntry(
  entry: any,
  opts: ValidationOptions,
): FileEntry | FileParentEntry | undefined {
  const intermediate = validateObjectKeys(
    entry,
    {
      required: ['file'],
      optional: [...COMMON_ENTRY_KEYS, 'children'],
    },
    opts,
  );
  if (!intermediate) {
    return undefined;
  }

  const file = validateString(intermediate.file, incrementOptions('file', opts));
  if (!file) {
    return undefined;
  }

  const commonEntry = validateCommonEntry(intermediate, opts);

  let output: FileEntry | FileParentEntry = { file, ...commonEntry };
  if (defined(entry.children)) {
    const children = validateList(
      intermediate.children,
      incrementOptions('children', opts),
      (item, ind) => validateEntry(item, incrementOptions(`children.${ind}`, opts)),
    );
    output = { children, ...output };
  }

  return output;
}

export function validateURLEntry(
  entry: any,
  opts: ValidationOptions,
): URLEntry | URLParentEntry | undefined {
  const intermediate = validateObjectKeys(
    entry,
    {
      required: ['url'],
      optional: [...COMMON_ENTRY_KEYS, 'children', 'open_in_same_tab'],
    },
    opts,
  );
  if (!intermediate) {
    return undefined;
  }

  const url = validateString(intermediate.url, incrementOptions('url', opts));
  if (!url) {
    return undefined;
  }

  const commonEntry = validateCommonEntry(intermediate, opts);

  let output: URLEntry | URLParentEntry = { url, ...commonEntry };

  if (defined(entry.open_in_same_tab)) {
    output.open_in_same_tab = validateBoolean(
      entry.open_in_same_tab,
      incrementOptions('open_in_same_tab', opts),
    );
  }

  if (defined(entry.children)) {
    const children = validateList(
      intermediate.children,
      incrementOptions('children', opts),
      (item, ind) => validateEntry(item, incrementOptions(`children.${ind}`, opts)),
    );
    output = { children, ...output };
  }

  return output;
}

export function validatePatternEntry(
  entry: any,
  opts: ValidationOptions,
): PatternEntry | undefined {
  const intermediate = validateObjectKeys(
    entry,
    {
      required: ['pattern'],
      optional: [...COMMON_ENTRY_KEYS, 'reverse'],
    },
    opts,
  );
  if (!intermediate) {
    return undefined;
  }

  const pattern = validateString(intermediate.pattern, incrementOptions('pattern', opts));
  if (!pattern) {
    return undefined;
  }

  const commonEntry = validateCommonEntry(intermediate, opts);
  const output: PatternEntry = { pattern, ...commonEntry };

  if (defined(intermediate.reverse)) {
    output.reverse = validateBoolean(intermediate.reverse, incrementOptions('reverse', opts));
  }

  return output;
}

export function validateParentEntry(entry: any, opts: ValidationOptions): ParentEntry | undefined {
  const intermediate = validateObjectKeys(
    entry,
    {
      required: ['title', 'children'],
      optional: [...COMMON_ENTRY_KEYS],
    },
    opts,
  );
  if (!intermediate) {
    return undefined;
  }

  const title = validateString(intermediate.title, incrementOptions('title', opts));
  if (!title) {
    return undefined;
  }

  const children = validateList(
    intermediate.children,
    incrementOptions('children', opts),
    (item, ind) => validateEntry(item, incrementOptions(`children.${ind}`, opts)),
  );

  if (!children) {
    return undefined;
  }

  const commonEntry = validateCommonEntry(intermediate, opts);

  return {
    children,
    title,
    ...commonEntry,
  };
}

export function validateEntry(entry: any, opts: ValidationOptions): Entry | undefined {
  const intermediate = validateObject(entry, opts);
  if (!intermediate) {
    return undefined;
  }
  if (defined(intermediate.file)) {
    return validateFileEntry(intermediate, opts);
  } else if (defined(intermediate.url)) {
    return validateURLEntry(intermediate, opts);
  } else if (defined(intermediate.pattern)) {
    return validatePatternEntry(intermediate, opts);
  } else if (defined(intermediate.title)) {
    return validateParentEntry(intermediate, opts);
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
  );
}
