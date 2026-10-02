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
  optional: ['severity', 'keys', 'paths'],
  alias: {
    rule: 'id',
    key: 'keys',
    path: 'paths',
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
  // We may have a list of keys/paths or a single key/path
  // validate and unpack to a separate error rule for each combination
  const unpack = (field: 'keys' | 'paths') => {
    if (!defined(value[field])) return [undefined];
    return validateList(
      value[field],
      { ...incrementOptions(field, opts), coerce: true },
      (item, ind) =>
        validateString(item, { ...incrementOptions(`${field}.${ind}`, opts), minLength: 1 }),
    );
  };
  const keyList = unpack('keys');
  const pathList = unpack('paths');
  if (!keyList || !pathList) return undefined;
  return keyList.flatMap((key) =>
    pathList.map((path) => ({
      ...output,
      ...(key !== undefined ? { key } : {}),
      ...(path !== undefined ? { path } : {}),
    })),
  );
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
