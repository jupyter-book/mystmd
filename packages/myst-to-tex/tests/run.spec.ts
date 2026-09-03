import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { unified } from 'unified';
import type { LatexResult, Options } from '../src';
import mystToTex from '../src';

type TestCase = {
  title: string;
  latex: string;
  mdast: Record<string, any>;
  imports?: string[];
};

type TestCases = {
  title: string;
  cases: TestCase[];
  options?: Options;
};

const excludedYml = ['glossaries.yml'];

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yml'))
  .filter((file) => !excludedYml.includes(file))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

casesList.forEach(({ title, cases, options }) => {
  describe(title, () => {
    test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { latex, mdast, imports }) => {
        const pipe = unified().use(mystToTex, options);
        pipe.runSync(mdast as any);
        const file = pipe.stringify(mdast as any);
        const result = file.result as LatexResult;
        expect(result.value).toEqual(latex);
        if (imports) expect(result.imports).toEqual(imports);
      },
    );
  });
});
