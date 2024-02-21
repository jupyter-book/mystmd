import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { parseTOC } from '../src';

type TestCase = {
  title: string;
  content: string;
  throws?: string; // RegExp pattern
  output?: object;
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
      (_, { content, throws, output }) => {
        if (output) {
          const toc = parseTOC(content);
          expect(toc).toEqual(output);
        } else if (throws) {
          const pattern = new RegExp(throws);
          expect(() => parseTOC(content)).toThrowError(pattern);
        } else {
          parseTOC(content);
        }
      },
    );
  });
});
