import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { unified } from 'unified';
import type { LatexResult } from '../src';
import mystToTex, { generatePreamble } from '../src';

type TestCase = {
  title: string;
  latex: string;
  mdast: Record<string, any>;
  printGlossaries: boolean;
};

type TestCases = {
  title: string;
  latexGlossary: string;
  cases: TestCase[];
};

const includedYml = ['glossaries.yml'];

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => includedYml.includes(file))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

casesList.forEach(({ title, latexGlossary, cases }) => {
  describe(title, () => {
    test.each(cases.map((c): [string, string, TestCase] => [c.title, latexGlossary, c]))(
      '%s',
      (_, expectedLatexGlossary, { latex, mdast, printGlossaries }) => {
        const pipe = unified().use(mystToTex, { printGlossaries });
        pipe.runSync(mdast as any);
        const file = pipe.stringify(mdast as any);
        const { suffix } = generatePreamble((file.result as LatexResult).preamble);
        const latexValue = (file.result as LatexResult).value + suffix;
        const printedGlossary = printGlossaries ? `\n${expectedLatexGlossary}` : '';
        const expectedResult = `${latex}${printedGlossary}`;
        expect(latexValue).toEqual(expectedResult);
      },
    );
  });
});
