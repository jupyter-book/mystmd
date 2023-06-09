import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { selectAll } from 'unist-util-select';
import { mystParse } from '../../src';

type TestCase = {
  title: string;
  markdown: string;
  mdast: Record<string, any>;
};

type TestCases = {
  title: string;
  cases: TestCase[];
};

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

casesList.forEach(({ title, cases }) => {
  describe(title, () => {
    test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { markdown, mdast }) => {
        const output = mystParse(markdown);
        // Dont worry about position
        selectAll('[position]', output).forEach((node) => {
          delete node.position;
        });
        expect(output).toEqual(mdast);
      },
    );
  });
});
