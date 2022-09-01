import {
  defined,
  incrementOptions,
  validateBoolean,
  validateChoice,
  validateEnum,
  validateList,
  validateNumber,
  validateObject,
  validateObjectKeys,
  validateString,
  validationError,
} from '@curvenote/validators';
import type { ValidationOptions } from '@curvenote/validators';
import type {
  ISession,
  TemplateOptionDefinition,
  TemplateTagDefinition,
  TemplateYml,
} from './types';
import { TEMPLATE_OPTION_TYPES } from './types';

function validateSingleTemplateOption(
  input: any,
  optionDefinition: TemplateOptionDefinition,
  opts: ValidationOptions,
) {
  const { type, regex, choices } = optionDefinition;
  switch (type) {
    case 'bool':
      return validateBoolean(input, opts);
    case 'str':
      return validateString(input, { ...opts, regex: regex });
    case 'choice':
      return validateChoice(input, { ...opts, choices: choices || [] });
    default:
      return validationError(`unknown type on option definition: "${type}"`, opts);
  }
}

function validateMultipleTemplateOption(
  input: any,
  optionDefinition: TemplateOptionDefinition,
  opts: ValidationOptions,
) {
  const value = validateList(input, opts, (item) => {
    return validateSingleTemplateOption(item, optionDefinition, opts);
  });
  if (value === undefined) return undefined;
  if (optionDefinition.required && value.length === 0) {
    return validationError('required option must have at least one value', opts);
  }
  return value;
}

export function validateTemplateOption(
  input: any,
  optionDefinition: TemplateOptionDefinition,
  opts: ValidationOptions,
) {
  if (optionDefinition.multiple) {
    return validateMultipleTemplateOption(input, optionDefinition, opts);
  }
  return validateSingleTemplateOption(input, optionDefinition, opts);
}

export function validateTemplateOptions(
  templateOptions: any,
  optionDefinitions: TemplateOptionDefinition[],
  opts: ValidationOptions,
) {
  const isRequired = (def: TemplateOptionDefinition) => {
    return def.required && !def.default;
  };
  const value = validateObjectKeys(
    templateOptions,
    {
      optional: optionDefinitions.filter((def) => !isRequired(def)).map((def) => def.id),
      required: optionDefinitions.filter((def) => isRequired(def)).map((def) => def.id),
    },
    opts,
  );
  if (value === undefined) return undefined;
  const output: Record<string, any> = {};
  optionDefinitions.forEach((def) => {
    if (defined(value[def.id])) {
      output[def.id] = validateTemplateOption(value[def.id], def, incrementOptions(def.id, opts));
    } else if (def.default) {
      output[def.id] = def.default;
    }
  });
  return output;
}

export function validateTemplateOptionDefinition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    {
      optional: ['description', 'default', 'required', 'multiple', 'choices', 'regex'],
      required: ['id', 'type'],
    },
    opts,
  );
  if (value === undefined) return undefined;
  const id = validateString(value.id, incrementOptions('id', opts));
  const optionType = validateEnum<TEMPLATE_OPTION_TYPES>(value.type, {
    ...incrementOptions('type', opts),
    enum: TEMPLATE_OPTION_TYPES,
  });
  if (id === undefined || optionType === undefined) return undefined;
  if (optionType === TEMPLATE_OPTION_TYPES.choice && !defined(value.choices)) {
    return validationError('"choices" must be defined for option type "choice"', opts);
  }
  const output: TemplateOptionDefinition = {
    id,
    type: optionType,
  };
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.required)) {
    output.required = validateBoolean(value.required, incrementOptions('required', opts));
  }
  if (defined(value.multiple)) {
    output.multiple = validateBoolean(value.multiple, incrementOptions('multiple', opts));
  }
  if (defined(value.choices)) {
    output.choices = validateList(value.choices, incrementOptions('choices', opts), (val, ind) => {
      return validateString(val, incrementOptions(`choices.${ind}`, opts));
    });
  }
  if (defined(value.regex)) {
    output.regex = validateString(value.regex, incrementOptions('regex', opts));
  }
  if (defined(value.default)) {
    output.default = validateTemplateOption(
      value.default,
      output,
      incrementOptions('default', opts),
    );
  }
  return output;
}

export function validateTemplateTagDefinition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    {
      optional: ['description', 'required', 'plain', 'max_chars', 'max_words'],
      required: ['id'],
    },
    opts,
  );
  if (value === undefined) return undefined;
  const id = validateString(value.id, incrementOptions('id', opts));
  if (id === undefined) return undefined;
  const output: TemplateTagDefinition = { id };
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.required)) {
    output.required = validateBoolean(value.required, incrementOptions('required', opts));
  }
  if (defined(value.plain)) {
    output.plain = validateBoolean(value.plain, incrementOptions('plain', opts));
  }
  if (defined(value.max_chars)) {
    output.max_chars = validateNumber(value.max_chars, {
      min: 0,
      integer: true,
      ...incrementOptions('max_chars', opts),
    });
  }
  if (defined(value.max_words)) {
    output.max_words = validateNumber(value.max_words, {
      min: 0,
      integer: true,
      ...incrementOptions('max_words', opts),
    });
  }
  return output;
}

export function validateTemplateConfig(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    { optional: ['build', 'schema', 'tagged', 'options'] },
    opts,
  );
  if (value === undefined) return undefined;
  const output: TemplateYml['config'] = {};
  if (defined(value.build)) {
    output.build = validateObject(value.build, incrementOptions('build', opts));
  }
  if (defined(value.schema)) {
    output.schema = validateObject(value.schema, incrementOptions('schema', opts));
  }
  if (defined(value.tagged)) {
    output.tagged = validateList(value.tagged, incrementOptions('tagged', opts), (val, ind) => {
      return validateTemplateTagDefinition(val, incrementOptions(`tagged.${ind}`, opts));
    });
  }
  if (defined(value.options)) {
    output.options = validateList(value.options, incrementOptions('options', opts), (val, ind) => {
      return validateTemplateOptionDefinition(val, incrementOptions(`options.${ind}`, opts));
    });
  }
  return output;
}

export function validateTemplateYml(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: ['metadata', 'config'] }, opts);
  if (value === undefined) return undefined;
  const output: TemplateYml = {};
  // Ignoring value.metadata for now; this is just unused template metadata
  if (defined(value.metadata)) {
    output.metadata = value.metadata;
  }
  if (defined(value.config)) {
    output.config = validateTemplateConfig(value.config, incrementOptions('config', opts));
  }
  return output;
}

export function errorLogger(session: ISession) {
  return (message: string) => session.log.error(message);
}
