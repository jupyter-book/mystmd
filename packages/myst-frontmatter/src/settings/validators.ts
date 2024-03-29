import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateChoice,
  validateObjectKeys,
} from 'simple-validators';
import type { ProjectSettings } from './types.js';
import { validateMystToTexSettings } from './validatorsMystToTex.js';

const OUTPUT_REMOVAL_OPTIONS: Required<ProjectSettings>['output_stderr'][] = [
  'show',
  'remove',
  'remove-warn',
  'remove-error',
  'warn',
  'error',
];
export const PROJECT_SETTINGS = [
  'output_stderr',
  'output_stdout',
  'output_matplotlib_strings',
  'myst_to_tex',
  'legacy_glossary_syntax',
];
export const PROJECT_SETTINGS_ALIAS = {
  stderr_output: 'output_stderr',
  stdout_output: 'output_stdout',
  mystToTex: 'myst_to_tex',
  tex: 'myst_to_tex', // The default is the renderer, not the parser
};

export function validateProjectAndPageSettings(
  value: Record<string, any>,
  opts: ValidationOptions,
): ProjectSettings | undefined {
  const output: ProjectSettings = {};
  const settings = validateObjectKeys(
    value,
    { optional: PROJECT_SETTINGS, alias: PROJECT_SETTINGS_ALIAS },
    opts,
  );
  if (!settings) return undefined;
  if (defined(settings.output_stderr)) {
    const output_stderr = validateChoice(settings.output_stderr, {
      ...incrementOptions('output_stderr', opts),
      choices: OUTPUT_REMOVAL_OPTIONS,
    });
    if (output_stderr) output.output_stderr = output_stderr;
  }
  if (defined(settings.output_stdout)) {
    const output_stdout = validateChoice(settings.output_stdout, {
      ...incrementOptions('output_stdout', opts),
      choices: OUTPUT_REMOVAL_OPTIONS,
    });
    if (output_stdout) output.output_stdout = output_stdout;
  }
  if (defined(settings.output_matplotlib_strings)) {
    const output_matplotlib_strings = validateChoice(settings.output_matplotlib_strings, {
      ...incrementOptions('output_matplotlib_strings', opts),
      choices: OUTPUT_REMOVAL_OPTIONS,
    });
    if (output_matplotlib_strings) output.output_matplotlib_strings = output_matplotlib_strings;
  }
  if (defined(settings.myst_to_tex)) {
    const myst_to_tex = validateMystToTexSettings(
      settings.myst_to_tex,
      incrementOptions('myst_to_tex', opts),
    );
    if (myst_to_tex) output.myst_to_tex = myst_to_tex;
  }
  if (defined(settings.legacy_glossary_syntax)) {
    const legacy_glossary_syntax = validateBoolean(
      settings.legacy_glossary_syntax,
      incrementOptions('legacy_glossary_syntax', opts),
    );
    if (legacy_glossary_syntax != null) output.legacy_glossary_syntax = legacy_glossary_syntax;
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}
