import type { Caption, Container } from 'myst-spec';
import type { Code } from 'myst-spec-ext';
import yaml from 'js-yaml';
import type { DirectiveData, DirectiveSpec, GenericNode } from 'myst-common';
import { fileError, fileWarn, normalizeLabel, ParseTypesEnum } from 'myst-common';
import type { VFile } from 'vfile';

function parseEmphasizeLines(emphasizeLinesString?: string | undefined): number[] | undefined {
  if (!emphasizeLinesString) return undefined;
  const emphasizeLines = emphasizeLinesString
    ?.split(',')
    .map((val) => Number(val.trim()))
    .filter((val) => Number.isInteger(val));
  return emphasizeLines;
}

/** This function parses both sphinx and RST code-block options */
export function getCodeBlockOptions(
  options: DirectiveData['options'],
  vfile: VFile,
): Pick<Code, 'emphasizeLines' | 'showLineNumbers' | 'startingLineNumber'> {
  if (options?.['lineno-start'] != null && options?.['number-lines'] != null) {
    fileWarn(vfile, 'Cannot use both "lineno-start" and "number-lines"', {
      source: 'code-block:options',
    });
  }
  const emphasizeLines = parseEmphasizeLines(options?.['emphasize-lines'] as string | undefined);
  const numberLines = options?.['number-lines'] as number | undefined;
  // Only include this in mdast if it is `true`
  const showLineNumbers =
    options?.linenos || options?.['lineno-start'] || options?.['lineno-match'] || numberLines
      ? true
      : undefined;
  let startingLineNumber: number | undefined =
    numberLines != null && numberLines > 1 ? numberLines : (options?.['lineno-start'] as number);
  if (options?.['lineno-match']) {
    startingLineNumber = 'match' as any;
  } else if (startingLineNumber == null || startingLineNumber <= 1) {
    startingLineNumber = undefined;
  }
  return {
    emphasizeLines,
    showLineNumbers,
    startingLineNumber,
  };
}

export const CODE_DIRECTIVE_OPTIONS: DirectiveSpec['options'] = {
  caption: {
    type: ParseTypesEnum.parsed,
  },
  linenos: {
    type: ParseTypesEnum.boolean,
    doc: 'Show line numbers',
  },
  'lineno-start': {
    type: ParseTypesEnum.number,
    doc: 'Start line numbering from a particular value, default is 1. If present, line numbering is activated.',
  },
  'number-lines': {
    type: ParseTypesEnum.number,
    doc: 'Alternative for "lineno-start", turns on line numbering and can be an integer that is the start of the line numbering.',
  },
  'emphasize-lines': {
    type: ParseTypesEnum.string,
    doc: 'Emphasize particular lines (comma-separated numbers), e.g. "3,5"',
  },
  // dedent: {
  //   type: ParseTypesEnum.number,
  //   doc: 'Strip indentation characters from the code block',
  // },
  // force: {
  //   type: ParseTypesEnum.boolean,
  //   doc: 'Ignore minor errors on highlighting',
  // },
};

export const codeDirective: DirectiveSpec = {
  name: 'code',
  alias: ['code-block', 'sourcecode'],
  arg: {
    type: ParseTypesEnum.string,
  },
  options: {
    label: {
      type: ParseTypesEnum.string,
      alias: ['name'],
    },
    class: {
      type: ParseTypesEnum.string,
      // class_option: list of strings?
    },
    ...CODE_DIRECTIVE_OPTIONS,
  },
  body: {
    type: ParseTypesEnum.string,
  },
  run(data, vfile): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const opts = getCodeBlockOptions(data.options, vfile);
    const code: Code = {
      type: 'code',
      lang: data.arg as string,
      class: data.options?.class as string,
      ...opts,
      value: data.body as string,
    };
    if (!data.options?.caption) {
      code.label = label;
      code.identifier = identifier;
      return [code];
    }
    const caption: Caption = {
      type: 'caption',
      children: [
        {
          type: 'paragraph',
          children: data.options.caption as any[],
        },
      ],
    };
    const container: Container = {
      type: 'container',
      kind: 'code' as any,
      label,
      identifier,
      children: [code as any, caption],
    };
    return [container];
  },
};

export const codeCellDirective: DirectiveSpec = {
  name: 'code-cell',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  options: {
    tags: {
      type: ParseTypesEnum.string,
    },
  },
  body: {
    type: ParseTypesEnum.string,
  },
  run(data, vfile): GenericNode[] {
    const code: Code = {
      type: 'code',
      lang: data.arg as string,
      executable: true,
      value: data.body as string,
    };
    let tags: string[] | undefined;
    // TODO: this validation should be done in a different place
    // For example, specifying that the attribute is YAML,
    // and providing a custom validation on the option.
    if (typeof data.options?.tags === 'string') {
      try {
        tags = yaml.load(data.options.tags) as string[];
      } catch (error) {
        fileError(vfile, 'Could not load tags for code-cell directive', {
          source: 'code-cell:tags',
        });
      }
    } else if (data.options?.tags && Array.isArray(data.options.tags)) {
      // if the options are loaded directly as yaml
      tags = data.options.tags as unknown as string[];
    }
    if (tags && Array.isArray(tags) && tags.every((t) => typeof t === 'string')) {
      if (tags && tags.length > 0) {
        code.data = { tags: tags.map((t) => t.trim()) };
      }
    } else if (tags) {
      fileWarn(vfile, 'tags in code-cell directive must be a list of strings', {
        source: 'code-cell:tags',
      });
    }
    return [code];
  },
};
