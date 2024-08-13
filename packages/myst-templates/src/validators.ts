import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { hashAndCopyStaticFile, isDirectory, isUrl } from 'myst-cli-utils';
import { TemplateKind, TemplateOptionType } from 'myst-common';
import type { ReferenceStash } from 'myst-frontmatter';
import {
  PAGE_FRONTMATTER_KEYS,
  PROJECT_FRONTMATTER_KEYS,
  RESERVED_EXPORT_KEYS,
  validateAffiliation,
  validateAndStashObject,
  validateContributor,
  validateGithubUrl,
  validateLicenses,
  validateProjectFrontmatter,
} from 'myst-frontmatter';
import {
  defined,
  filterKeys,
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
  validationWarning,
} from 'simple-validators';
import type { ValidationOptions } from 'simple-validators';
import type {
  ISession,
  TemplateDocDefinition,
  TemplateOptionDefinition,
  TemplatePartDefinition,
  TemplateStyles,
  TemplateYml,
} from './types.js';
import { KIND_TO_EXT } from './download.js';

export type FileOptions = { copyFolder?: string; relativePathFrom?: string; allowRemote?: boolean };

export type FileValidationOptions = ValidationOptions & FileOptions;

/** Validate that input is an existing file name
 *
 * Resolved relative to the file cached on validation options.
 * Full resolved path is returned.
 *
 * If opts.allowRemote is true, input may be a URL.
 * In this case, the URL is returned unchanged.
 */
function validateFile(session: ISession, input: any, opts: FileValidationOptions) {
  const filename = validateString(input, opts);
  if (!filename) return;
  if (opts.allowRemote && isUrl(filename)) return filename;
  let resolvedFile: string;
  if (opts.file) {
    resolvedFile = path.resolve(path.dirname(opts.file), filename);
  } else {
    resolvedFile = path.resolve(filename);
  }
  if (!fs.existsSync(resolvedFile)) {
    return validationError(`unable to resolve file: ${filename}`, opts);
  }
  const { copyFolder, relativePathFrom } = opts;
  if (copyFolder) {
    const hashedFile = hashAndCopyStaticFile(session, resolvedFile, copyFolder);
    if (!hashedFile) {
      return validationError(`unable to copy file: ${resolvedFile} -> ${copyFolder}`, opts);
    }
    resolvedFile = path.join(copyFolder, hashedFile);
  }
  if (relativePathFrom) {
    return path.relative(relativePathFrom, resolvedFile);
  }
  return resolvedFile;
}

export function validateTemplateOption(
  session: ISession,
  input: any,
  optionDefinition: TemplateOptionDefinition,
  opts: FileValidationOptions,
) {
  const { type, max_chars, min, max, integer, choices } = optionDefinition;
  switch (type) {
    case TemplateOptionType.boolean:
      return validateBoolean(input, opts);
    case TemplateOptionType.string:
      return validateString(input, { ...opts, maxLength: max_chars });
    case TemplateOptionType.number:
      return validateNumber(input, { ...opts, min, max, integer });
    case TemplateOptionType.choice:
      return validateChoice(input, { ...opts, choices: choices || [] });
    case TemplateOptionType.file:
      return validateFile(session, input, opts);
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

export function makeValidateOptionsFunction(reservedKeys: string[]) {
  return (
    session: ISession,
    options: any,
    optionDefinitions: TemplateOptionDefinition[],
    opts: FileValidationOptions,
  ) => {
    const value = validateObject(options, opts);
    if (value === undefined) return undefined;
    const filteredOptions = optionDefinitions.filter((def) => {
      return conditionMet(def, value);
    });
    const required = filteredOptions.filter((def) => isRequired(def)).map((def) => def.id);
    const optional = filteredOptions
      .filter((def) => !isRequired(def))
      .map((def) => def.id)
      .concat(reservedKeys);
    validateKeys(value, { optional, required }, { returnInvalidPartial: true, ...opts });
    const output: Record<string, any> = {};
    filteredOptions.forEach((def) => {
      if (defined(value[def.id]) || def.default) {
        output[def.id] = validateTemplateOption(
          session,
          value[def.id] ?? def.default,
          def,
          incrementOptions(def.id, opts),
        );
      }
    });
    return output;
  };
}

export const validateTemplateOptions = makeValidateOptionsFunction(RESERVED_EXPORT_KEYS);

export function validateTemplatePart(
  part: any,
  partDefinition: TemplatePartDefinition,
  opts: ValidationOptions,
) {
  const { id, max_chars, max_words } = partDefinition;
  const partValue = validateString(part, opts);
  if (max_chars != null && partValue && partValue.length > max_chars) {
    validationError(
      `part block "${id}" must be less than or equal to ${max_chars} characters`,
      opts,
    );
  }
  if (max_words != null && partValue && partValue.split(' ').length > max_words) {
    validationError(`part block "${id}" must be less than or equal to ${max_words} words`, opts);
  }
  return partValue;
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
  const output: Record<string, string | string[]> = {};
  filteredParts.forEach((def) => {
    const { id, as_list } = def;
    if (defined(value[id])) {
      let partValue: string | string[] | undefined;
      if (as_list) {
        partValue = validateList(value[id], incrementOptions(id, opts), (item, index) => {
          return validateTemplatePart(item, def, incrementOptions(`${id}.${index}`, opts));
        });
      } else {
        partValue = validateTemplatePart(value[id], def, incrementOptions(id, opts));
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
  const output = validateProjectFrontmatter(
    filterKeys(frontmatter, PROJECT_FRONTMATTER_KEYS),
    opts,
  );
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

export function validateTemplateOptionDefinition(
  session: ISession,
  input: any,
  opts: ValidationOptions,
) {
  const value = validateObjectKeys(
    input,
    {
      optional: [
        'title',
        'description',
        'default',
        'required',
        'choices',
        'min',
        'max',
        'integer',
        'max_chars',
        'condition',
      ],
      required: ['id', 'type'],
    },
    opts,
  );
  if (value === undefined) return undefined;
  const optionType = validateEnum<TemplateOptionType>(value.type, {
    ...incrementOptions('type', opts),
    enum: TemplateOptionType,
  });
  if (optionType === undefined) return undefined;
  if (optionType === TemplateOptionType.choice && !defined(value.choices)) {
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
    if (output.type === 'choice') {
      output.choices = validateList(
        value.choices,
        incrementOptions('choices', opts),
        (val, ind) => {
          return validateString(val, incrementOptions(`choices.${ind}`, opts));
        },
      );
    } else {
      validationError('type must be "choice" to use "choices" option', opts);
    }
  }
  if (defined(value.max_chars)) {
    if (output.type === 'string') {
      output.max_chars = validateNumber(value.max_chars, {
        min: 0,
        integer: true,
        ...incrementOptions('max_chars', opts),
      });
    } else {
      validationError('type must be "string" to use "max_chars" option', opts);
    }
  }
  if (defined(value.integer)) {
    if (output.type === 'number') {
      output.integer = validateBoolean(value.integer, incrementOptions('integer', opts));
    } else {
      validationError('type must be "number" to use "integer" option', opts);
    }
  }
  if (defined(value.min)) {
    if (output.type === 'number') {
      output.min = validateNumber(value.min, {
        ...incrementOptions('min', opts),
        integer: output.integer,
      });
    } else {
      validationError('type must be "number" to use "min" option', opts);
    }
  }
  if (defined(value.max)) {
    if (output.type === 'number') {
      output.max = validateNumber(value.max, {
        ...incrementOptions('max', opts),
        integer: output.integer,
      });
    } else {
      validationError('type must be "number" to use "max" option', opts);
    }
  }
  if (defined(output.min) && defined(output.max) && output.max < output.min) {
    validationWarning('"min" and "max" options are flipped', opts);
    const [min, max] = [output.min, output.max];
    output.min = max;
    output.max = min;
  }
  if (defined(value.condition)) {
    output.condition = validateCondition(value.condition, incrementOptions('condition', opts));
  }
  if (defined(value.default)) {
    output.default = validateTemplateOption(
      session,
      value.default,
      output,
      incrementOptions('default', opts),
    );
  }
  return output;
}

export function crossValidateConditions(
  session: ISession,
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
        const val = validateTemplateOption(
          session,
          def.condition.value,
          optionDefLookup[def.condition.id],
          {
            ...opts,
            suppressErrors: true,
            suppressWarnings: true,
          },
        );
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
        'as_list',
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
  if (defined(value.as_list)) {
    output.as_list = validateBoolean(value.as_list, incrementOptions('as_list', opts));
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
  session: ISession,
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
        'affiliations',
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
        'template',
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
  if (defined(value.kind)) {
    output.kind = validateEnum(value.kind, {
      ...incrementOptions('kind', opts),
      enum: TemplateKind,
    });
  }
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.version)) {
    output.version = validateString(value.version, incrementOptions('version', opts));
  }
  const stash: ReferenceStash = {};
  if (defined(value.affiliations)) {
    const affiliationsOpts = incrementOptions('affiliations', opts);
    let affiliations = value.affiliations;
    if (typeof affiliations === 'string') {
      affiliations = affiliations.split(';').map((aff) => aff.trim());
    }
    validateList(affiliations, affiliationsOpts, (aff) => {
      return validateAndStashObject(
        aff,
        stash,
        'affiliations',
        validateAffiliation,
        affiliationsOpts,
      );
    });
  }
  if (defined(value.authors)) {
    output.authors = validateList(
      value.authors,
      incrementOptions('authors', opts),
      (author, index) => {
        return validateContributor(author, stash, incrementOptions(`authors.${index}`, opts));
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
      return validateTemplateOptionDefinition(
        session,
        val,
        incrementOptions(`options.${ind}`, opts),
      );
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
        const filePath = [...opts.templateDir.split(path.sep), file].join('/');
        const matches = globSync(filePath).map((match) => match.split('/').join(path.sep));
        const files = matches.filter((match) => !isDirectory(match));
        if (!matches.length) {
          validationError(`file does not exist: ${filePath}`, fileOpts);
        } else if (!files.length) {
          validationError(`file must not be directory: ${filePath}`, fileOpts);
        }
      }
      return file;
    });
  }
  if (defined(value.template)) {
    const templateOpts = incrementOptions('template', opts);
    const template = validateString(value.template, templateOpts);
    if (template && output.kind && path.extname(template) !== KIND_TO_EXT[output.kind]) {
      validationError(
        `template extension "${path.extname(template)}" must match kind "${
          KIND_TO_EXT[output.kind]
        }"`,
        templateOpts,
      );
    }
    if (template && opts.templateDir) {
      const templatePath = [...opts.templateDir.split(path.sep), template].join('/');
      const matches = globSync(templatePath).map((match) => match.split('/').join(path.sep));
      const files = matches.filter((match) => !isDirectory(match));
      if (!matches.length) {
        validationError(`template does not exist: ${templatePath}`, templateOpts);
      } else if (!files.length) {
        validationError(`template must not be directory: ${templatePath}`, templateOpts);
      }
    }
    output.template = template;
  }
  if (stash.affiliations) {
    output.affiliations = stash.affiliations;
  }
  crossValidateConditions(
    session,
    output.options || [],
    output.parts || [],
    output.doc || [],
    opts,
  );
  return output;
}
