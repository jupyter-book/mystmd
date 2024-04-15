import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateChoice,
  validateList,
  validateObjectKeys,
  validateString,
} from 'simple-validators';
import type { ErrorRule } from './types.js';

const ERROR_RULE_KEY_OBJECT = {
  required: ['id'],
  optional: ['severity'],
  alias: {
    rule: 'id',
  },
};

export function validateErrorRule(input: any, opts: ValidationOptions): ErrorRule | undefined {
  if (typeof input === 'string') {
    input = { id: input };
  }
  const value = validateObjectKeys(input, ERROR_RULE_KEY_OBJECT, {
    ...opts,
    suppressWarnings: true,
    keepExtraKeys: true,
  });
  if (value === undefined) return undefined;
  const id = validateString(value.id, incrementOptions('id', opts));
  if (!id) return undefined;
  const output: ErrorRule = { id };
  if (defined(value.severity)) {
    const choice = validateChoice(value.severity, {
      ...incrementOptions('severity', opts),
      choices: ['ignore', 'warn', 'error'],
    }) as ErrorRule['severity'];
    if (choice) output.severity = choice;
  }
  // Put the unknown fields back on the object
  const knownFields = [...ERROR_RULE_KEY_OBJECT.required, ...ERROR_RULE_KEY_OBJECT.optional];
  Object.entries(value).forEach(([key, entry]) => {
    if (knownFields.includes(key)) return;
    output[key] = entry;
  });
  return output;
}

export function validateErrorRuleList(
  input: any,
  opts: ValidationOptions,
): ErrorRule[] | undefined {
  if (input === undefined) return undefined;
  const output = validateList(
    input,
    { coerce: true, ...incrementOptions('error_rules', opts) },
    (exp, ind) => {
      return validateErrorRule(exp, incrementOptions(`error_rules.${ind}`, opts));
    },
  );
  if (!output) return undefined;
  return output;
}
