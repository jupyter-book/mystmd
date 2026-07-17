import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { upgradeContent } from './syntax.js';

type TestFile = {
  cases: TestCase[];
};

type TestCase = {
  title: string;
  source: string;
  result: string | undefined;
};

const file = 'syntax.yml';

const testYaml = fs.readFileSync(path.join(__dirname, file)).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('upgradeSyntax', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { source, result }) => {
      const sourceLines = source.split(/\r\n|\r|\n/);
      const resultLines = result?.split(/\r\n|\r|\n/);
      const transformedLines = await upgradeContent([...sourceLines]);
      expect(transformedLines).toEqual(resultLines);
    },
  );
});
