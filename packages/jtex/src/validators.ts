import fs from 'fs';
import path from 'path';
import {
  PAGE_FRONTMATTER_KEYS,
  RESERVED_EXPORT_KEYS,
  validateAuthor,
  validateGithubUrl,
  validateLicenses,
  validatePageFrontmatter,
} from 'myst-frontmatter';
import type {
  TemplateDocDefinition,
  TemplateOptionDefinition,
  TemplatePartDefinition,
  TemplateStyles,
  TemplateYml,
} from 'myst-templates';
import { TemplateOptionTypes } from 'myst-templates';
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
  validateUrl,
  validationError,
} from 'simple-validators';
import type { ValidationOptions } from 'simple-validators';

export function validateTemplateOption(
  input: any,
  optionDefinition: TemplateOptionDefinition,
  opts: ValidationOptions,
) {
  const { type, max_chars, choices } = optionDefinition;
  switch (type) {
    case TemplateOptionTypes.boolean:
      return validateBoolean(input, opts);
    case TemplateOptionTypes.string:
      return validateString(input, { ...opts, maxLength: max_chars });
    case TemplateOptionTypes.choice:
      return validateChoice(input, { ...opts, choices: choices || [] });
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
  opts: ValidationOptions,
) {
  const value = validateObject(options, opts);
  if (value === undefined) return undefined;
  const filteredOptions = optionDefinitions.filter((def) => {
    return conditionMet(def, value);
  });
  const required = filteredOptions.filter((def) => isRequired(def)).map((def) => def.id);
  const optional = filteredOptions
    .filter((def) => !isRequired(def))
    .map((def) => def.id)
    .concat(RESERVED_EXPORT_KEYS);
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

export function validateTemplateParts(
  parts: any,
  partsDefinitions: TemplatePartDefinition[],
  options: Record<string, any>,
  opts: ValidationOptions,
) {
  const filteredParts = partsDefinitions.filter((def) => conditionMet(def, options));
  const optional = filteredParts.filter((def) => !isRequired(def)).map((def) => def.id);
  const required = filteredParts.filter((def) => isRequired(def)).map((def) => def.id);
  const value = validateObjectKeys(
    parts,
    { optional, required },
    { returnInvalidPartial: true, ...opts },
  );
  if (value === undefined) return undefined;
  const output: Record<string, string> = {};
  filteredParts.forEach((def) => {
    const { id, max_chars, max_words } = def;
    if (defined(value[id])) {
      const partValue = validateString(value[id], incrementOptions(id, opts));
      if (max_chars != null && partValue && partValue.length > max_chars) {
        validationError(
          `part block "${id}" must be less than or equal to ${max_chars} characters`,
          opts,
        );
      }
      if (max_words != null && partValue && partValue.split(' ').length > max_words) {
        validationError(
          `part block "${id}" must be less than or equal to ${max_words} words`,
          opts,
        );
      }
      if (partValue !== undefined) output[def.id] = partValue;
    }
  });
  return output;
}

export function validateTemplateDoc(
  frontmatter: any,
  docDefinitions: TemplateDocDefinition[],
  options: Record<string, any>,
  opts: ValidationOptions,
) {
  const output = validatePageFrontmatter(frontmatter, opts);
  if (output === undefined) return undefined;
  const filteredDoc = docDefinitions.filter((def) => {
    return conditionMet(def, { ...options });
  });
  const required = filteredDoc.filter((def) => isRequired(def)).map((def) => def.id);
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

export function validateTemplateDocDefinition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    {
      optional: ['title', 'description', 'required', 'condition'],
      required: ['id'],
    },
    opts,
  );
  if (value === undefined) return undefined;
  const id = validateChoice(value.id, {
    choices: PAGE_FRONTMATTER_KEYS,
    ...incrementOptions('id', opts),
  });
  if (id === undefined) return undefined;
  const output: TemplateDocDefinition = { id };
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.required)) {
    output.required = validateBoolean(value.required, incrementOptions('required', opts));
  }
  if (defined(value.condition)) {
    output.condition = validateCondition(value.condition, incrementOptions('condition', opts));
  }
  return output;
}

export function validateTemplateOptionDefinition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    {
      optional: [
        'title',
        'description',
        'default',
        'required',
        'choices',
        'max_chars',
        'condition',
      ],
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
  const idOpts = incrementOptions('id', opts);
  const id = validateString(value.id, idOpts);
  if (id === undefined) return undefined;
  if (RESERVED_EXPORT_KEYS.includes(id)) {
    return validationError(
      `cannot use reserved export property for template option: "${id}"`,
      idOpts,
    );
  }
  const output: TemplateOptionDefinition = {
    id,
    type: optionType,
  };
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
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
  partsDefinitions: TemplatePartDefinition[],
  docDefinitions: TemplateDocDefinition[],
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
  [...optionDefinitions, ...partsDefinitions, ...docDefinitions].forEach((def) => {
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
    } else if (def.condition && def.condition.id !== def.id) {
      validationError(`unknown condition id: ${def.condition.id}`, opts);
    }
  });
}

export function validateTemplatePartDefinition(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    {
      optional: [
        'title',
        'description',
        'required',
        'plain',
        'max_chars',
        'max_words',
        'condition',
      ],
      required: ['id'],
    },
    opts,
  );
  if (value === undefined) return undefined;
  const id = validateString(value.id, incrementOptions('id', opts));
  if (id === undefined) return undefined;
  const output: TemplatePartDefinition = { id };
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
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

export function validateTemplateStyle(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: ['citation', 'bibliography'] }, opts);
  if (value === undefined) return undefined;
  const output: TemplateStyles = {};
  if (defined(value.citation)) {
    output.citation = validateChoice(value.citation, {
      ...incrementOptions('citation', opts),
      choices: ['numerical-only'],
    });
  }
  if (defined(value.bibliography)) {
    output.bibliography = validateChoice(value.bibliography, {
      ...incrementOptions('bibliography', opts),
      choices: ['natbib', 'biblatex'],
    });
  }
  return output;
}

export function validateTemplateYml(
  input: any,
  opts: ValidationOptions & { templateDir?: string },
) {
  const inputObj = validateObject(input, opts);
  if (inputObj === undefined) return undefined;
  if (inputObj?.jtex && !inputObj?.myst) {
    inputObj.myst = inputObj.jtex;
  }
  const value = validateObjectKeys(
    inputObj,
    {
      required: ['myst'],
      optional: [
        'kind',
        'jtex',
        'title',
        'description',
        'version',
        'authors',
        'license',
        'tags',
        'source',
        'github',
        'thumbnail',
        'build',
        'style',
        'parts',
        'doc',
        'options',
        'packages',
        'files',
      ],
    },
    opts,
  );
  if (value === undefined) return undefined;
  const myst = validateChoice<'v1'>(value.myst, {
    ...incrementOptions('myst', opts),
    choices: ['v1'],
  });
  if (myst === undefined) return undefined;
  const output: TemplateYml = { myst };
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.version)) {
    output.version = validateString(value.version, incrementOptions('version', opts));
  }
  if (defined(value.authors)) {
    output.authors = validateList(
      value.authors,
      incrementOptions('authors', opts),
      (author, index) => {
        return validateAuthor(author, incrementOptions(`authors.${index}`, opts));
      },
    );
  }
  if (defined(value.license)) {
    output.license = validateLicenses(value.license, incrementOptions('license', opts));
  }
  if (defined(value.source)) {
    output.source = validateUrl(value.source, incrementOptions('source', opts));
  }
  if (defined(value.github)) {
    output.github = validateGithubUrl(value.github, incrementOptions('github', opts));
  }
  if (defined(value.thumbnail)) {
    output.thumbnail = validateString(value.thumbnail, incrementOptions('thumbnail', opts));
  }
  if (defined(value.tags)) {
    output.tags = validateList(value.tags, incrementOptions('tags', opts), (file, index) => {
      return validateString(file, incrementOptions(`tags.${index}`, opts));
    });
  }
  if (defined(value.build)) {
    output.build = validateObject(value.build, incrementOptions('build', opts));
  }
  if (defined(value.style)) {
    output.style = validateTemplateStyle(value.style, incrementOptions('style', opts));
  }
  if (defined(value.parts)) {
    output.parts = validateList(value.parts, incrementOptions('parts', opts), (val, ind) => {
      return validateTemplatePartDefinition(val, incrementOptions(`parts.${ind}`, opts));
    });
  }
  if (defined(value.doc)) {
    output.doc = validateList(value.doc, incrementOptions('doc', opts), (val, ind) => {
      return validateTemplateDocDefinition(val, incrementOptions(`doc.${ind}`, opts));
    });
  }
  if (defined(value.options)) {
    output.options = validateList(value.options, incrementOptions('options', opts), (val, ind) => {
      return validateTemplateOptionDefinition(val, incrementOptions(`options.${ind}`, opts));
    });
  }
  if (defined(value.packages)) {
    output.packages = validateList(
      value.packages,
      incrementOptions('packages', opts),
      (val, ind) => {
        return validateString(val, incrementOptions(`packages.${ind}`, opts));
      },
    );
  }
  if (defined(value.files)) {
    output.files = validateList(value.files, incrementOptions('files', opts), (val, ind) => {
      const fileOpts = incrementOptions(`files.${ind}`, opts);
      const file = validateString(val, fileOpts);
      if (file && opts.templateDir) {
        const filePath = path.resolve(opts.templateDir, ...file.split('/'));
        if (!fs.existsSync(filePath)) {
          validationError(`file does not exist: ${filePath}`, fileOpts);
        } else if (fs.lstatSync(filePath).isDirectory()) {
          validationError(`file must not be directory: ${filePath}`, fileOpts);
        }
      }
      return file;
    });
  }
  crossValidateConditions(output.options || [], output.parts || [], output.doc || [], opts);
  return output;
}
