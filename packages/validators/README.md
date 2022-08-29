# @curvenote/validators

Schema validation functions and error reporting framework

## Scope

This package provides basic validation functions for building more complex schema validation. It is explicit and verbose with no magic to infer anything from existing types. Rather than throwing validation errors, these functions pass error/warning messages out as options and return `undefined`; the consumer may then choose how to handle error reporting.

## Usage

```typescript
import fs from 'fs';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateEmail,
  validateObjectKeys,
  validateString,
  validationError,
  ValidationOptions,
} from '@curvenote/validators';

// Define typescript type
export type Author = {
  id: string;
  name?: string;
  email?: string;
  corresponding?: boolean;
};

// Define validation function for object, which explicitly checks each property
export function validateAuthor(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    { required: ['id'], optional: ['name', 'corresponding', 'email'] },
    opts,
  );
  if (value === undefined) return undefined;
  const id = validateString(value.id, {
    ...incrementOptions('id', opts),
    regex: '^[a-z][a-zA-Z0-9]{19}$',
  });
  if (id === undefined) return undefined;
  const output: Author = { id };
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.email)) {
    output.email = validateEmail(value.email, incrementOptions('email', opts));
  }
  if (defined(value.corresponding)) {
    const correspondingOpts = incrementOptions('corresponding', opts);
    if (value.corresponding && !defined(value.email)) {
      validationError('corresponding author must have email', correspondingOpts);
    }
    output.corresponding = validateBoolean(value.corresponding, correspondingOpts);
  }
  return output;
}

// Consume validation function with logging and error handling
export function loadAuthorFromFile(authorFile: string) {
  const rawAuthor = JSON.parse(fs.readFileSync(authorFile).toString());
  const opts: ValidationOptions = {
    file: authorFile,
    property: 'author',
    messages: {},
    errorLogFn: (message: string) => console.log(`Error: ${message}`),
    warningLogFn: (message: string) => console.log(`Warning: ${message}`),
  };
  const author = validateAuthor(rawAuthor, opts);
  if (!author || opts.messages.errors?.length) {
    throw new Error(`Unable to load author from file ${authorFile}`);
  }
  return author;
}
```
