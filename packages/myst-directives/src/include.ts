import type { DirectiveSpec } from 'myst-common';
import { ParseTypesEnum, fileWarn, normalizeLabel } from 'myst-common';
import { CODE_DIRECTIVE_OPTIONS, getCodeBlockOptions } from './code.js';
import type { Include } from 'myst-spec-ext';
import type { VFile } from 'vfile';

/**
 * RST documentation:
 *  - https://docutils.sourceforge.io/docs/ref/rst/directives.html#including-an-external-document-fragment
 *
 * Sphinx documentation:
 *  - https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#directive-literalinclude
 */
export const includeDirective: DirectiveSpec = {
  name: 'include',
  alias: ['literalinclude'],
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  options: {
    label: {
      type: ParseTypesEnum.string,
      alias: ['name'],
    },
    literal: {
      type: ParseTypesEnum.boolean,
      doc: 'Flag the include block as literal, and show the contents as a code block. This can also be set automatically by setting the `language` or using the `literalinclude` directive.',
    },
    lang: {
      type: ParseTypesEnum.string,
      doc: 'The language of the code to be highlighted as. If set, this automatically changes an `include` into a `literalinclude`.',
      alias: ['language', 'code'],
    },
    ...CODE_DIRECTIVE_OPTIONS,
    'start-line': {
      type: ParseTypesEnum.number,
      doc: 'Only the content starting from this line will be included. The first line has index 0 and negative values count from the end.',
    },
    'start-at': {
      type: ParseTypesEnum.string,
      doc: 'Only the content after and including the first occurrence of the specified text in the external data file will be included.',
    },
    'start-after': {
      type: ParseTypesEnum.string,
      doc: 'Only the content after the first occurrence of the specified text in the external data file will be included.',
    },
    'end-line': {
      type: ParseTypesEnum.number,
      doc: 'Only the content up to (but excluding) this line will be included.',
    },
    'end-at': {
      type: ParseTypesEnum.string,
      doc: 'Only the content up to and including the first occurrence of the specified text in the external data file (but after any start-after text) will be included.',
    },
    'end-before': {
      type: ParseTypesEnum.string,
      doc: 'Only the content before the first occurrence of the specified text in the external data file (but after any start-after text) will be included.',
    },
    lines: {
      type: ParseTypesEnum.string,
      doc: 'Specify exactly which lines to include, starting at 1. For example, `1,3,5-10,20-` includes the lines 1, 3, 5 to 10 and lines 20 to the last line.',
    },
    'lineno-match': {
      type: ParseTypesEnum.boolean,
      doc: 'Display the original line numbers, correct only when the selection consists of contiguous lines.',
    },
  },
  run(data, vfile): Include[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const literal =
      data.name === 'literalinclude' || !!data.options?.literal || !!data.options?.lang;

    const file = data.arg as string;
    if (!literal) {
      // TODO: warn on unused options
      return [
        {
          type: 'include',
          file,
          label,
          identifier,
        },
      ];
    }
    const lang = (data.options?.lang as string) ?? extToLanguage(file.split('.').pop());
    const opts = getCodeBlockOptions(data.options, vfile);
    const filter: Include['filter'] = {};
    ensureOnlyOneOf(vfile, data.options, ['start-at', 'start-line', 'start-after', 'lines']);
    ensureOnlyOneOf(vfile, data.options, ['end-at', 'end-line', 'end-before', 'lines']);
    filter.startAt = data.options?.['start-at'] as string;
    filter.startAfter = data.options?.['start-after'] as string;
    filter.endAt = data.options?.['end-at'] as string;
    filter.endBefore = data.options?.['end-before'] as string;
    if (data.options?.lines) {
      filter.lines = parseLinesString(vfile, data.options?.lines as string);
    } else {
      const startLine = data.options?.['start-line'] as number;
      const endLine = data.options?.['end-line'] as number;
      const lines = [];
      if (startLine != null) lines.push(startLine);
      if (startLine == null && endLine != null) lines.push(0);
      if (endLine != null) lines.push(endLine);
      if (lines.length > 0) {
        filter.lines = [
          lines.map((n) => {
            if (n >= 0) return n + 1;
            return n;
          }) as [number, number?],
        ];
      }
    }
    return [
      {
        type: 'include',
        file,
        literal,
        lang,
        label,
        identifier,
        caption: data.options?.caption as any[],
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        ...opts,
      },
    ];
  },
};

type Lines = Required<Include>['filter']['lines'];

export function parseLinesString(vfile: VFile, linesString: string | undefined): Lines {
  if (!linesString) return undefined;
  return linesString
    .split(',')
    .map((l) => {
      const line = l.trim();
      const match = line.match(/^([0-9]+)(?:\s*(-)\s*([0-9]+)?)?$/);
      if (!match) {
        fileWarn(vfile, `Unknown lines match "${line}"`);
        return undefined;
      }
      const [, first, dash, last] = match;
      if (!dash && !last) {
        return Number.parseInt(first);
      }
      if (dash && !last) {
        return [Number.parseInt(first)];
      }
      return [Number.parseInt(first), Number.parseInt(last)];
    })
    .filter((l) => !!l) as Lines;
}

function ensureOnlyOneOf(
  vfile: VFile,
  options: Record<string, any> | undefined,
  exclusive: string[],
): void {
  if (!options) return;
  const set1 = new Set(exclusive);
  const set2 = new Set(Object.keys(options));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  if (intersection.size > 1) {
    fileWarn(vfile, `Conflicting options for directive: ["${[...intersection].join('", "')}"]`, {
      note: `Choose a single option out of ["${[...exclusive].join('", "')}"]`,
    });
  }
}

function extToLanguage(ext?: string): string | undefined {
  return (
    {
      ts: 'typescript',
      js: 'javascript',
      tex: 'latex',
      py: 'python',
      md: 'markdown',
      yml: 'yaml',
    }[ext ?? ''] ?? ext
  );
}
