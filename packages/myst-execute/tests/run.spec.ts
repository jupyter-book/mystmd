import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { executionTransform } from '../src';
import type { GenericParent } from 'myst-common';

type TestCase = {
  title: string;
  before: GenericParent;
  after: GenericParent;
};

type TestCases = {
  title: string;
  cases: TestCase[];
};

const only = '';

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

casesList.forEach(({ title, cases }) => {
  const filtered = cases.filter((c) => !only || c.title === only);
  if (filtered.length === 0) return;
  describe(title, () => {
    test.each(filtered.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { before, after }) => {
        executionTransform(before);
        expect(yaml.dump(before)).toEqual(yaml.dump(after));
      },
    );
  });
});
