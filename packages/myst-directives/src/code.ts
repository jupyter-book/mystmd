import type { Caption, Container } from 'myst-spec';
import type { Code } from 'myst-spec-ext';
import yaml from 'js-yaml';
import type { DirectiveSpec, GenericNode } from 'myst-common';
import { fileError, fileWarn, normalizeLabel, ParseTypesEnum } from 'myst-common';

export const codeDirective: DirectiveSpec = {
  name: 'code',
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
    // force: {
    //   type: ParseTypesEnum.boolean,
    //   doc: 'Ignore minor errors on highlighting',
    // },
    'number-lines': {
      type: ParseTypesEnum.number,
    },
  },
  body: {
    type: ParseTypesEnum.string,
  },
  run(data): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const numberLines = data.options?.['number-lines'] as number | undefined;
    const showLineNumbers = !!numberLines;
    const startingLineNumber = numberLines && numberLines > 1 ? numberLines : undefined;
    return [
      {
        type: 'code',
        lang: data.arg,
        identifier,
        label,
        class: data.options?.class,
        showLineNumbers,
        startingLineNumber,
        value: data.body as string | undefined,
      },
    ];
  },
};

export const codeBlockDirective: DirectiveSpec = {
  name: 'code-block',
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
    // force: {
    //   type: ParseTypesEnum.boolean,
    //   doc: 'Ignore minor errors on highlighting',
    // },
    caption: {
      type: ParseTypesEnum.parsed,
    },
    linenos: {
      type: ParseTypesEnum.boolean,
      doc: 'Add line numbers',
    },
    'lineno-start': {
      type: ParseTypesEnum.number,
      doc: 'Start line numbering from a particular value',
    },
    // dedent: {
    //   type: ParseTypesEnum.number,
    //   doc: 'Strip indentation characters from the code block',
    // },
    'emphasize-lines': {
      type: ParseTypesEnum.string,
      doc: 'Emphasize particular lines (comma-separated numbers)',
    },
  },
  body: {
    type: ParseTypesEnum.string,
  },
  run(data): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    // Validating this should probably happen first
    const emphasizeLinesString = data.options?.['emphasize-lines'] as string | undefined;
    const emphasizeLines = emphasizeLinesString
      ?.split(',')
      .map((val) => Number(val.trim()))
      .filter((val) => Number.isInteger(val));
    if (!data.options?.caption) {
      return [
        {
          type: 'code',
          lang: data.arg,
          identifier,
          label,
          class: data.options?.class,
          showLineNumbers: data.options?.linenos,
          startingLineNumber: data.options?.['lineno-start'],
          emphasizeLines,
          value: data.body as string,
        },
      ];
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
    const code: Code = {
      type: 'code',
      lang: data.arg as string,
      class: data.options?.class as string,
      showLineNumbers: data.options?.linenos as boolean,
      startingLineNumber: data.options?.['lineno-start'] as number,
      emphasizeLines,
      value: data.body as string,
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
