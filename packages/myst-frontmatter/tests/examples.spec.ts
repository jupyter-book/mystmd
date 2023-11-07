import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ValidationOptions } from 'simple-validators';
import { glob } from 'glob';
import { validatePageFrontmatter, validateProjectFrontmatter } from '../src';

type TestFile = {
  title: string;
  frontmatter?: 'project' | 'page';
  cases: TestCase[];
};

type TestCase = {
  title: string;
  skip: boolean;
  raw: string;
  normalized?: string;
  warnings?: number;
  errors?: number;
  opts?: Record<string, boolean>;
};

const files = await glob(
  [path.join(__dirname, '*.yml'), path.join(__dirname, '..', 'src', '**', '*.yml')],
  {
    ignore: path.join(__dirname, '..', 'src', 'utils', '*.yml'),
  },
);

const only = ''; // Can set this to a test title

const casesList = files
  .map((file) => ({ name: file, data: fs.readFileSync(file).toString() }))
  .map((file) => {
    const tests = yaml.load(file.data) as TestFile;
    tests.title = tests.title ?? file.name;
    return tests;
  });

casesList.forEach(({ title, frontmatter, cases }) => {
  describe(title, () => {
    const casesToUse = cases.filter((c) => (!only && !c.skip) || (only && c.title === only));
    const skippedCases = cases.filter((c) => c.skip || (only && c.title !== only));
    if (casesToUse.length === 0) return;
    if (skippedCases.length > 0) {
      // Log to test output for visibility
      test.skip.each(skippedCases.map((c): [string, TestCase] => [c.title, c]))('%s', () => {});
    }
    test.each(casesToUse.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { raw, normalized, warnings, errors }) => {
        const opts: ValidationOptions = { property: '', messages: {} };
        const validator =
          frontmatter === 'project' ? validateProjectFrontmatter : validatePageFrontmatter;
        const result = validator(raw, opts);
        if (only) {
          // This runs in "only" mode
          console.log(raw);
        }
        // Print the warnings and errors if they are not expected
        if ((opts.messages.warnings?.length ?? 0) !== (warnings ?? 0)) {
          console.log(opts.messages.warnings);
        }
        if ((opts.messages.errors?.length ?? 0) !== (errors ?? 0)) {
          console.log(opts.messages.errors);
        }
        expect(result).toEqual(normalized);
        expect(opts.messages.warnings?.length ?? 0).toBe(warnings ?? 0);
        expect(opts.messages.errors?.length ?? 0).toBe(errors ?? 0);

        // Test that normalized frontmatter is idempotent
        expect(validator(normalized, opts)).toEqual(normalized);
      },
    );
  });
});
