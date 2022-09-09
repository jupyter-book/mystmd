import type { PageFrontmatter } from '@curvenote/frontmatter';
import { validatePageFrontmatter } from '@curvenote/frontmatter';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateChoice,
  validateEnum,
  validateKeys,
  validateList,
  validateNumber,
  validateObject,
  validateObjectKeys,
  validateString,
  validationError,
} from '@curvenote/validators';
import type { ValidationOptions } from '@curvenote/validators';
import type { TemplateOptionDefinition, TemplateTagDefinition, TemplateYml } from './types';
import { DOC_FRONTMATTER_KEYS, TemplateOptionTypes } from './types';

export function validateTemplateOption(
  input: any,
  optionDefinition: TemplateOptionDefinition,
  opts: ValidationOptions,
) {
  const { type, max_chars, choices } = optionDefinition;
  switch (type) {
    case TemplateOptionTypes.bool:
      return validateBoolean(input, opts);
    case TemplateOptionTypes.str:
      return validateString(input, { ...opts, maxLength: max_chars });
    case TemplateOptionTypes.choice:
      return validateChoice(input, { ...opts, choices: choices || [] });
    case TemplateOptionTypes.frontmatter:
      // validated elsewhere
      return input;
    default:
      return validationError(`unknown type on option definition: "${type}"`, opts);
  }
}

const isRequired = (def: { required?: boolean; default?: any }) => {
  return def.required && def.default === undefined;
};

const conditionMet = (
  def: { condition?: { id: string; value?: any } },
  lookup: Record<string, any>,
) => {
  if (!def.condition) return true;
  const value = lookup[def.condition.id];
  if (value === undefined) return false;
  if (def.condition.value !== undefined && value !== def.condition.value) return false;
  return true;
};

export function validateTemplateOptions(
  options: any,
  optionDefinitions: TemplateOptionDefinition[],
  frontmatter: PageFrontmatter,
  opts: ValidationOptions,
) {
  const value = validateObject(options, opts);
  if (value === undefined) return undefined;
  const filteredOptions = optionDefinitions
    .filter((def) => def.type !== TemplateOptionTypes.frontmatter)
    .filter((def) => conditionMet(def, { ...value, ...frontmatter }));
  const required = filteredOptions.filter((def) => isRequired(def)).map((def) => def.id);
  const optional = filteredOptions.filter((def) => !isRequired(def)).map((def) => def.id);
  validateKeys(value, { optional, required }, { returnInvalidPartial: true, ...opts });
  const output: Record<string, any> = {};
  filteredOptions.forEach((def) => {
    if (defined(value[def.id])) {
      output[def.id] = validateTemplateOption(value[def.id], def, incrementOptions(def.id, opts));
    } else if (def.default) {
      output[def.id] = def.default;
    }
  });
  return output;
}

export function validateTemplateTagged(
  tagged: any,
  taggedDefinitions: TemplateTagDefinition[],
  options: Record<string, any>,
  frontmatter: PageFrontmatter,
  opts: ValidationOptions,
) {
  const filteredTagged = taggedDefinitions.filter((def) =>
    conditionMet(def, { ...options, ...frontmatter }),
  );
  const optional = filteredTagged.filter((def) => !isRequired(def)).map((def) => def.id);
  const required = filteredTagged.filter((def) => isRequired(def)).map((def) => def.id);
  const value = validateObjectKeys(
    tagged,
    { optional, required },
    { returnInvalidPartial: true, ...opts },
  );
  if (value === undefined) return undefined;
  const output: Record<string, string> = {};
  filteredTagged.forEach((def) => {
    const { id, max_chars, max_words } = def;
    if (defined(value[id])) {
      const tagValue = validateString(value[id], incrementOptions(id, opts));
      if (max_chars != null && tagValue && tagValue.length > max_chars) {
        validationError(
          `tagged block "${id}" must be less than or equal to ${max_chars} characters`,
          opts,
        );
      }
      if (max_words != null && tagValue && tagValue.split(' ').length > max_words) {
        validationError(
          `tagged block "${id}" must be less than or equal to ${max_words} words`,
          opts,
        );
      }
      if (tagValue !== undefined) output[def.id] = tagValue;
    }
  });
  return output;
}

export function validateFrontmatterTemplateOptions(
  frontmatter: any,
  optionDefinitions: TemplateOptionDefinition[],
  opts: ValidationOptions,
) {
  const output = validatePageFrontmatter(frontmatter, opts);
  if (output === undefined) return undefined;
  const required = optionDefinitions
    .filter((def) => def.type === TemplateOptionTypes.frontmatter)
    .filter((def) => isRequired(def))
    .map((def) => def.id);
  validateObjectKeys(output, { required }, { suppressWarnings: true, ...opts });
  return output;
}

function validateCondition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: ['value'], required: ['id'] }, opts);
  if (value === undefined) return undefined;
  const id = validateString(value.id, incrementOptions('id', opts));
  if (id === undefined) return undefined;
  return { id, value: value.value };
}

export function validateTemplateOptionDefinition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    {
      optional: ['description', 'default', 'required', 'choices', 'max_chars', 'condition'],
      required: ['id', 'type'],
    },
    opts,
  );
  if (value === undefined) return undefined;
  const optionType = validateEnum<TemplateOptionTypes>(value.type, {
    ...incrementOptions('type', opts),
    enum: TemplateOptionTypes,
  });
  if (optionType === undefined) return undefined;
  if (optionType === TemplateOptionTypes.choice && !defined(value.choices)) {
    return validationError('"choices" must be defined for option type "choice"', opts);
  }
  let id: string | undefined;
  const idOpts = incrementOptions('id', opts);
  if (optionType === TemplateOptionTypes.frontmatter) {
    id = validateChoice(value.id, { choices: DOC_FRONTMATTER_KEYS, ...idOpts });
  } else {
    id = validateString(value.id, idOpts);
  }
  if (id === undefined) return undefined;
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
  if (defined(value.choices)) {
    output.choices = validateList(value.choices, incrementOptions('choices', opts), (val, ind) => {
      return validateString(val, incrementOptions(`choices.${ind}`, opts));
    });
  }
  if (defined(value.max_chars)) {
    output.max_chars = validateNumber(value.max_chars, {
      min: 0,
      integer: true,
      ...incrementOptions('max_chars', opts),
    });
  }
  if (defined(value.condition)) {
    output.condition = validateCondition(value.condition, incrementOptions('condition', opts));
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

export function crossValidateConditions(
  optionDefinitions: TemplateOptionDefinition[],
  taggedDefinitions: TemplateTagDefinition[],
  opts: ValidationOptions,
) {
  const optionDefLookup: Record<string, TemplateOptionDefinition> = {};
  optionDefinitions.forEach((def) => {
    if (def.condition && def.condition.id === def.id) {
      validationError(`option id cannot match condition id: ${def.id}`, opts);
    } else {
      optionDefLookup[def.id] = def;
    }
  });
  [...optionDefinitions, ...taggedDefinitions].forEach((def) => {
    if (def.condition && optionDefLookup[def.condition.id]) {
      if (defined(def.condition.value)) {
        const val = validateTemplateOption(def.condition.value, optionDefLookup[def.condition.id], {
          ...opts,
          suppressErrors: true,
          suppressWarnings: true,
        });
        if (val === undefined) {
          validationError(
            `invalid condition value "${def.condition.value}" for id: ${def.condition.id}`,
            opts,
          );
        }
      }
    } else if (
      def.condition &&
      !DOC_FRONTMATTER_KEYS.includes(def.condition.id) &&
      def.condition.id !== def.id
    ) {
      validationError(`unknown condition id: ${def.condition.id}`, opts);
    }
  });
}

export function validateTemplateTagDefinition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    {
      optional: ['description', 'required', 'plain', 'max_chars', 'max_words', 'condition'],
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
  if (defined(value.condition)) {
    output.condition = validateCondition(value.condition, incrementOptions('condition', opts));
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
  crossValidateConditions(output.options || [], output.tagged || [], opts);
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
