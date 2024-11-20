import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { createId, normalizeLabel } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from 'myst-directives';

export const exerciseDirective: DirectiveSpec = {
  name: 'exercise',
  alias: ['exercise-start'],
  arg: {
    type: 'myst',
  },
  options: {
    ...commonDirectiveOptions('exercise'),
    nonumber: {
      type: Boolean,
      doc: 'Legacy flag to disable numbering of exercises; equivalent to `enumerated: false`',
    },
    hidden: {
      type: Boolean,
    },
  },
  body: {
    type: 'myst',
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      children.push({
        type: 'admonitionTitle',
        children: data.arg as GenericNode[],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }

    const exercise: GenericNode = {
      type: 'exercise',
      hidden: data.options?.hidden as boolean,
      children: children as any[],
    };
    addCommonDirectiveOptions(data, exercise);

    // Override default `enumerated` behavior
    if (data.options?.nonumber !== undefined) {
      // If `nonumber` is defined, it takes precedence over enumerated
      exercise.enumerated = !data.options.nonumber as boolean;
    } else {
      // Default `enumerated` value is true if unspecified
      exercise.enumerated = (data.options?.enumerated as boolean | undefined) ?? true;
    }

    // Numbered, unlabeled exercises still need a label
    const backupLabel = exercise.enumerated ? `exercise-${createId()}` : undefined;
    const rawLabel = (data.options?.label as string) || backupLabel;
    const { label, identifier } = normalizeLabel(rawLabel) || {};
    exercise.label = label;
    exercise.identifier = identifier;

    if (data.name.endsWith('-start')) {
      exercise.gate = 'start';
    }
    return [exercise];
  },
};

export const solutionDirective: DirectiveSpec = {
  name: 'solution',
  alias: ['solution-start'],
  arg: {
    type: String,
    required: true,
  },
  options: {
    label: {
      type: String,
    },
    class: {
      type: String,
    },
    hidden: {
      type: Boolean,
    },
  },
  body: {
    type: 'myst',
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      const { label, identifier } = normalizeLabel(data.arg as string) || {};
      children.push({
        type: 'admonitionTitle',
        children: [
          { type: 'text', value: 'Solution to ' },
          { type: 'crossReference', label, identifier },
        ],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }
    const rawLabel = data.options?.label as string;
    const { label, identifier } = normalizeLabel(rawLabel) || {};
    const solution: GenericNode = {
      type: 'solution',
      label,
      identifier,
      class: data.options?.class as string,
      hidden: data.options?.hidden as boolean,
      children: children as any[],
    };
    if (data.name.endsWith('-start')) {
      solution.gate = 'start';
    }
    return [solution];
  },
};

export const solutionEndDirective: DirectiveSpec = {
  name: 'solution-end',
  run: () => [{ type: 'solution', gate: 'end' }],
};

export const exerciseEndDirective: DirectiveSpec = {
  name: 'exercise-end',
  run: () => [{ type: 'exercise', gate: 'end' }],
};

export const exerciseDirectives = [
  exerciseDirective,
  exerciseEndDirective,
  solutionDirective,
  solutionEndDirective,
];
