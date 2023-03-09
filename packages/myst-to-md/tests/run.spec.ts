import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { unified } from 'unified';
import mystToMd from '../src';

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
        const pipe = unified().use(mystToMd);
        pipe.runSync(mdast as any);
        const file = pipe.stringify(mdast as any);
        expect(file.result).toEqual(markdown);
      },
    );
  });
});
