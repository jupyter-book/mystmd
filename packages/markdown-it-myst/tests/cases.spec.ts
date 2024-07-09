import { describe, expect, test, vi } from 'vitest';
import type Token from 'markdown-it/lib/token';
import { citationsPlugin, labelsPlugin } from '../src';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';

type TestFile = {
  title: string;
  cases: TestCase[];
};
type TestCase = {
  title: string;
  md: string;
  tokens: Token[];
};

const directory = path.join('tests');
const files = ['citations.yml', 'labels.yml'];

const only = ''; // Can set this to a test title

const casesList = files
  .map((file) => ({ name: file, data: fs.readFileSync(path.join(directory, file)).toString() }))
  .map((file) => {
    const tests = yaml.load(file.data) as TestFile;
    tests.title = tests.title ?? file.name;
    return tests;
  });

casesList.forEach(({ title, cases }) => {
  const casesToUse = cases.filter((c) => !only || c.title === only);
  if (casesToUse.length === 0) return;
  describe(title, () => {
    test.each(casesToUse.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { md, tokens }) => {
        const mdit = MarkdownIt().use(citationsPlugin).use(labelsPlugin);
        const parsed = mdit.parse(md, {});
        expect(parsed).containSubset(tokens);
      },
    );
  });
});
