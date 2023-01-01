import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { validatePageFrontmatter } from '../src';
import type { ValidationOptions } from 'simple-validators';

type TestFile = {
  title: string;
  cases: TestCase[];
};

type TestCase = {
  title: string;
  raw: string;
  normalized?: string;
  warnings?: number;
  opts?: Record<string, boolean>;
};

const directory = path.join('tests');
const files = ['authors.yml'];

const only = ''; // Can set this to a test title

const casesList = files
  .map((file) => ({ name: file, data: fs.readFileSync(path.join(directory, file)).toString() }))
  .map((file) => {
    const tests = yaml.load(file.data) as TestFile;
    tests.title = tests.title ?? file.name;
    return tests;
  });

casesList.forEach(({ title, cases }) => {
  describe(title, () => {
    const casesToUse = cases.filter((c) => !only || c.title === only);
    if (casesToUse.length === 0) return;
    test.each(casesToUse.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { raw, normalized, warnings }) => {
        const opts: ValidationOptions = { property: '', messages: {} };
        const result = validatePageFrontmatter(raw, opts);
        if (only) {
          // This runs in "only" mode
          console.log(raw);
        }
        if (opts.messages.warnings?.length !== (warnings ?? 0)) {
          console.log(opts.messages.warnings);
        }
        expect(result).toEqual(normalized);
        expect(opts.messages.warnings?.length ?? 0).toBe(warnings ?? 0);
      },
    );
  });
});
