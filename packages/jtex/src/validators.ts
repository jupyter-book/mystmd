import {
  defined,
  incrementOptions,
  validateBoolean,
  validateChoice,
  validateEnum,
  validateList,
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

export function validateTemplateOption(
  input: any,
  optionDefinition: TemplateOptionDefinition,
  opts: ValidationOptions,
) {
  switch (optionDefinition.type) {
    case 'bool':
      return validateBoolean(input, opts);
    case 'str':
      return validateString(input, opts);
    case 'choice':
      return validateChoice(input, { ...opts, choices: optionDefinition.choices || [] });
    default:
      return validationError(`unknown type on option definition: "${optionDefinition.type}"`, opts);
  }
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
      optional: ['description', 'default', 'required', 'multiple', 'choices'],
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
    const choicesOpts = incrementOptions('choices', opts);
    output.choices = validateList(value.choices, choicesOpts, (val, ind) => {
      return validateString(val, incrementOptions(String(ind), choicesOpts));
    });
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
      optional: ['description', 'required', 'plain', 'chars', 'words'],
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
  // chars, words
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
    const taggedOpts = incrementOptions('tagged', opts);
    output.tagged = validateList(value.tagged, taggedOpts, (val, ind) => {
      return validateTemplateTagDefinition(val, incrementOptions(String(ind), taggedOpts));
    });
  }
  if (defined(value.options)) {
    const optionsOpts = incrementOptions('options', opts);
    output.options = validateList(value.options, optionsOpts, (val, ind) => {
      return validateTemplateOptionDefinition(val, incrementOptions(String(ind), optionsOpts));
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
