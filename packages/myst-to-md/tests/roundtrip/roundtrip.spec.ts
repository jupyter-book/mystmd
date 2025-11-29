import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { mystParse } from 'myst-parser';
import { unified } from 'unified';
import mystToMd from '../../src';

type TestCase = {
  title: string;
  markdown: string;
  result: string;
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
      (_, { markdown, result: expected }) => {
        const mdast = mystParse(markdown, { mdast: { hoistSingleImagesOutofParagraphs: false } });
        const file = unified()
          .use(mystToMd)
          .stringify(mdast as any);
        const result = (file.result as string).trim();
        expect(result).toEqual(expected);
      },
    );
  });
});
