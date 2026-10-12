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
  const keyList = defined(value.keys)
    ? validateList(value.keys, { ...incrementOptions('keys', opts), coerce: true }, (key, ind) =>
        validateString(key, { ...incrementOptions(`keys.${ind}`, opts), minLength: 1 }),
      )
    : [undefined];
  const pathList = defined(value.paths)
    ? validateList(value.paths, { ...incrementOptions('paths', opts), coerce: true }, (path, ind) =>
        validateString(path, { ...incrementOptions(`paths.${ind}`, opts), minLength: 1 }),
      )
    : [undefined];
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
