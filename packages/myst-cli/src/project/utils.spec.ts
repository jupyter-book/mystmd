import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { findYAMLSection } from './utils.js';

type TestFile = {
  cases: TestCase[];
};
type SectionInfo = {
  start: number;
  stop: number;
  indent: number | undefined;
};
type TestCase = {
  title: string;
  name: string;
  source: string;
  result: SectionInfo | undefined;
  opts?: Record<string, any>;
};

const file = 'utils.yml';

const testYaml = fs.readFileSync(path.join(__dirname, file)).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('findYAMLSection', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { name, source, result, opts }) => {
      const lines = source.split(/\r\n|\r|\n/);
      const transformed = findYAMLSection(name, opts?.indent ?? 0, lines, opts?.index ?? 0);
      console.log(JSON.stringify(lines, null, 2));
      console.log(JSON.stringify(source));
      expect(transformed).toEqual(result);
    },
  );
});
