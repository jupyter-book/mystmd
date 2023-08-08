import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { validatePageFrontmatter, validateProjectFrontmatter } from '../src';
import type { ValidationOptions } from 'simple-validators';

type TestFile = {
  title: string;
  frontmatter?: 'project' | 'page';
  cases: TestCase[];
};

type TestCase = {
  title: string;
  raw: string;
  normalized?: string;
  warnings?: number;
  errors?: number;
  opts?: Record<string, boolean>;
};

const directory = path.join('tests');
const files = [
  'affiliations.yml',
  'authors.yml',
  'credit.yml',
  'orcid.yml',
  'licenses.yml',
  'exports.yml',
  'keywords.yml',
  'thebe.yml',
];

const only = ''; // Can set this to a test title

const casesList = files
  .map((file) => ({ name: file, data: fs.readFileSync(path.join(directory, file)).toString() }))
  .map((file) => {
    const tests = yaml.load(file.data) as TestFile;
    tests.title = tests.title ?? file.name;
    return tests;
  });

casesList.forEach(({ title, frontmatter, cases }) => {
  describe(title, () => {
    const casesToUse = cases.filter((c) => !only || c.title === only);
    if (casesToUse.length === 0) return;
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
        if ((opts.messages.warnings?.length ?? 0) !== (warnings ?? 0)) {
          console.log(opts.messages.warnings);
        }
        expect(opts.messages.warnings?.length ?? 0).toBe(warnings ?? 0);
        expect(opts.messages.errors?.length ?? 0).toBe(errors ?? 0);
      },
    );
  });
});
