import type { Code, Caption, Container } from 'myst-spec';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';

export const codeDirective: DirectiveSpec = {
  name: 'code',
  arg: {
    type: ParseTypesEnum.string,
  },
  options: {
    name: {
      type: ParseTypesEnum.string,
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
  run(data: DirectiveData): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.name as string | undefined) || {};
    const numberLines = data.options?.['number-lines'];
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
    name: {
      type: ParseTypesEnum.string,
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
  run(data: DirectiveData): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.name as string | undefined) || {};
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
