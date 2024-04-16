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
  optional: ['severity', 'keys'],
  alias: {
    rule: 'id',
    key: 'keys',
  },
};

export function validateErrorRule(input: any, opts: ValidationOptions): ErrorRule[] | undefined {
  if (typeof input === 'string') {
    input = { id: input };
  }
  const value = validateObjectKeys(input, ERROR_RULE_KEY_OBJECT, {
    ...opts,
  });
  if (value === undefined) return undefined;
  const id = validateString(value.id, incrementOptions('id', opts));
  const severity = validateChoice(value.severity || 'ignore', {
    ...incrementOptions('severity', opts),
    choices: ['ignore', 'warn', 'error'],
  }) as ErrorRule['severity'];
  if (!id || !severity) return undefined;
  const output: ErrorRule = { id, severity };
  if (!defined(value.keys)) return [output];
  // We now have either a list of keys or a single key
  // validate and unpack to a separate error rule
  const keyList = validateList(
    value.keys,
    { ...incrementOptions('keys', opts), coerce: true },
    (key, ind) => {
      return validateString(key, incrementOptions(`keys.${ind}`, opts));
    },
  );
  if (!keyList) return undefined;
  return keyList.map((key) => ({ ...output, key }));
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
  return output.flat();
}
